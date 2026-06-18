import {createHash} from "crypto";
import {existsSync, readFileSync} from "fs";
import {resolve} from "path";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import {onRequest} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {defineSecret} from "firebase-functions/params";
import Papa from "papaparse";
import {csvRowToProduct} from "./mappers.js";
import type {CsvRow, ProductDocument} from "./mappers.js";
import {slugify} from "./slugify.js";

const restoreToken = defineSecret("RESTORE_TOKEN");

const FUNCTION_OPTIONS = {
  region: "europe-west3",
  invoker: "public" as const,
  secrets: [restoreToken],
};

const CSV_STORAGE_PATH = "backups/products.csv";
const BATCH_SIZE = 499;
const META_DOC = "_meta/csvSync";

interface RestoreResult {
  restored: boolean;
  count: number;
  skipped: number;
  mode?: "full" | "delta" | "skipped";
}

// ─── Hash helpers ─────────────────────────────────────────────────────────────

function computeCsvHash(csvString: string): string {
  return createHash("sha256").update(csvString).digest("hex");
}

async function getStoredHash(db: ReturnType<typeof getFirestore>): Promise<string | null> {
  const snap = await db.doc(META_DOC).get();
  return snap.exists ? ((snap.data()?.csvHash as string | undefined) ?? null) : null;
}

async function saveHash(db: ReturnType<typeof getFirestore>, csvHash: string): Promise<void> {
  await db.doc(META_DOC).set({csvHash, lastSynced: Timestamp.now()});
}

// ─── Delta sync ───────────────────────────────────────────────────────────────

async function runDeltaSync(
  db: ReturnType<typeof getFirestore>,
  rows: CsvRow[],
  categoryIds: Map<string, string>,
): Promise<RestoreResult> {
  // 1. Fetch all current products from Firestore
  const existingSnap = await db.collection("products").get();
  const existingMap = new Map<string, Record<string, unknown>>();
  for (const doc of existingSnap.docs) {
    existingMap.set(doc.id, doc.data() as Record<string, unknown>);
  }

  // 2. Map CSV rows to products
  const csvMap = new Map<string, ProductDocument>();
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.Produktname?.trim()) {
      console.warn(`[deltaSync] Row ${i}: empty Produktname — skipped.`);
      skipped++;
      continue;
    }
    try {
      const categoryId = categoryIds.get(row.Kategorie?.trim()) ?? "unknown";
      const product = csvRowToProduct(row, categoryId);
      csvMap.set(product.slug, product);
    } catch (err) {
      console.error(`[deltaSync] Row ${i} ("${row.Produktname}") failed — skipped:`, err);
      skipped++;
    }
  }

  // 3. Diff into buckets
  const added: Array<[string, ProductDocument]> = [];
  const updated: Array<[string, ProductDocument]> = [];
  const removed: string[] = [];

  for (const [slug, csvProduct] of csvMap) {
    if (!existingMap.has(slug)) {
      added.push([slug, csvProduct]);
    } else {
      const fbDoc = existingMap.get(slug)!;
      const differs = !Object.keys(csvProduct).every(
        (key) =>
          String((csvProduct as unknown as Record<string, unknown>)[key]) ===
          String((fbDoc as Record<string, unknown>)[key]),
      );
      if (differs) {
        updated.push([slug, csvProduct]);
      }
    }
  }

  for (const docId of existingMap.keys()) {
    if (!csvMap.has(docId)) {
      removed.push(docId);
    }
  }

  console.log(
    `[deltaSync] +${added.length} added, ~${updated.length} updated, -${removed.length} removed`,
  );

  // 4. Apply upserts in batches
  const toUpsert = [...added, ...updated];
  for (let start = 0; start < toUpsert.length; start += BATCH_SIZE) {
    const chunk = toUpsert.slice(start, start + BATCH_SIZE);
    const batch = db.batch();
    for (const [slug, product] of chunk) {
      batch.set(db.collection("products").doc(slug), product);
    }
    await batch.commit();
  }

  // 5. Apply deletions in batches
  for (let start = 0; start < removed.length; start += BATCH_SIZE) {
    const chunk = removed.slice(start, start + BATCH_SIZE);
    const batch = db.batch();
    for (const slug of chunk) {
      batch.delete(db.collection("products").doc(slug));
    }
    await batch.commit();
  }

  return {restored: true, count: added.length + updated.length, skipped, mode: "delta"};
}

/**
 * Core logic: checks if /products is empty (full import) or if the CSV has
 * changed since the last sync (delta sync). Hash is stored at _meta/csvSync.
 * Shared between the HTTP handler and the scheduled trigger.
 */
async function runRestore(): Promise<RestoreResult> {
  const db = getFirestore();

  console.log("[checkAndRestore] Checking products collection count...");
  const countSnap = await db.collection("products").count().get();
  const existingCount = countSnap.data().count;

  // ── 1. Load CSV — try Storage first, fall back to bundled file ───────────
  let csvString: string;
  try {
    const bucket = getStorage().bucket();
    const [contents] = await bucket.file(CSV_STORAGE_PATH).download();
    if (contents.length === 0) throw new Error("Storage file is empty");
    csvString = contents.toString("utf-8");
    console.log(`[checkAndRestore] CSV loaded from Storage (${csvString.length} bytes).`);
  } catch (storageErr) {
    console.warn("[checkAndRestore] Storage unavailable — falling back to bundled CSV.", storageErr);
    // __dirname is the compiled lib/csv-failsafe/ directory; CSV ships at functions/product-list/
    const bundledPath = resolve(__dirname, "../../product-list/Produktelist.csv");
    if (!existsSync(bundledPath)) {
      console.error("[checkAndRestore] Bundled CSV not found at:", bundledPath);
      throw new Error("No CSV source available.");
    }
    csvString = readFileSync(bundledPath, "utf-8");
    console.log(`[checkAndRestore] CSV loaded from bundled file (${csvString.length} bytes).`);
  }

  // ── 2. Compute hash and decide sync mode ─────────────────────────────────
  const csvHash = computeCsvHash(csvString);

  if (existingCount > 0) {
    const storedHash = await getStoredHash(db);
    if (csvHash === storedHash) {
      console.log(
        `[checkAndRestore] ${existingCount} products found, CSV unchanged — no sync needed.`,
      );
      return {restored: false, count: existingCount, skipped: 0, mode: "skipped"};
    }
    console.log("[checkAndRestore] CSV change detected — running delta sync...");
  } else {
    console.log("[checkAndRestore] Collection is empty. Starting full CSV import...");
  }

  // ── 3. Parse CSV ──────────────────────────────────────────────────────────
  const {data: rows, errors: parseErrors} = Papa.parse<CsvRow>(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (parseErrors.length > 0) {
    console.warn("[checkAndRestore] CSV parse warnings:", parseErrors);
  }
  console.log(`[checkAndRestore] Parsed ${rows.length} rows.`);

  // ── 4. Resolve / create categories ───────────────────────────────────────
  const uniqueCategories = [...new Set(rows.map((r) => r.Kategorie?.trim()).filter(Boolean))];
  const categoryIds = await resolveCategories(db, uniqueCategories);

  // ── 5a. Delta sync (collection non-empty, CSV changed) ───────────────────
  if (existingCount > 0) {
    const result = await runDeltaSync(db, rows, categoryIds);
    await saveHash(db, csvHash);
    return result;
  }

  // ── 5b. Full import (collection empty) ───────────────────────────────────
  let written = 0;
  let skipped = 0;

  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const batchRows = rows.slice(start, start + BATCH_SIZE);
    const batch = db.batch();

    for (let i = 0; i < batchRows.length; i++) {
      const row = batchRows[i];
      const rowIndex = start + i;

      if (!row.Produktname?.trim()) {
        console.warn(`[checkAndRestore] Row ${rowIndex}: empty Produktname — skipped.`);
        skipped++;
        continue;
      }

      try {
        const categoryId = categoryIds.get(row.Kategorie?.trim()) ?? "unknown";
        const product = csvRowToProduct(row, categoryId);
        batch.set(db.collection("products").doc(product.slug), product);
        written++;
      } catch (err) {
        console.error(
          `[checkAndRestore] Row ${rowIndex} ("${row.Produktname}") failed — skipped:`,
          err,
        );
        skipped++;
      }
    }

    await batch.commit();
    console.log(
      `[checkAndRestore] Batch committed (rows ${start}–${start + batchRows.length - 1}).`,
    );
  }

  console.log(`[checkAndRestore] Done. Written: ${written}, Skipped: ${skipped}.`);
  await saveHash(db, csvHash);
  return {restored: true, count: written, skipped, mode: "full"};
}

/**
 * HTTP function — call manually or from a health-check pipeline.
 * Protected by RESTORE_TOKEN Bearer auth in production.
 * Auth is skipped in the local emulator.
 */
export const checkAndRestoreProducts = onRequest(FUNCTION_OPTIONS, async (req, res) => {
  const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
  if (!isEmulator) {
    const token = restoreToken.value();
    const authHeader = req.headers.authorization ?? "";
    if (!token || authHeader !== `Bearer ${token}`) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }
  }

  try {
    const result = await runRestore();
    res.json(result);
  } catch (err) {
    console.error("[checkAndRestore] Unexpected error:", err);
    res.status(500).json({restored: false, error: String(err)});
  }
});

/**
 * Scheduled trigger — runs every day at 03:00 Europe/Berlin.
 * Automatically restores products/categories from CSV if Firestore is empty
 * (e.g. after an accidental deletion or a cold project reset).
 */
export const scheduledProductCheck = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: "Europe/Berlin",
    region: "europe-west3",
  },
  async () => {
    try {
      const result = await runRestore();
      console.log("[scheduledProductCheck] Result:", JSON.stringify(result));
    } catch (err) {
      console.error("[scheduledProductCheck] Error:", err);
    }
  },
);

// ─── Category helpers ─────────────────────────────────────────────────────────

/**
 * Always derives the category document ID as slugify(name).
 * Uses set-with-merge so existing docs with custom fields (e.g. order) are preserved.
 */
async function resolveCategories(
  db: ReturnType<typeof getFirestore>,
  categoryNames: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const batch = db.batch();

  for (const name of categoryNames) {
    const slug = slugify(name);
    const ref = db.collection("categories").doc(slug);
    batch.set(ref, {name, slug, order: 0, active: true}, {merge: true});
    result.set(name, slug);
  }

  await batch.commit();
  return result;
}

/**
 * One-time script: imports Produktelist.csv into production Firestore.
 *
 * Uses set (upsert) — safe to run multiple times. Existing products are
 * overwritten with fresh data from the CSV; categories are merged.
 *
 * Run from the project root:
 *   npx ts-node --esm functions/src/import-to-production.ts
 *
 * Prerequisites:
 *   - firebase emulators must NOT be running (or the env vars below must be absent)
 *   - The service account key must be present at functions/nazaris-feinkost-firebase-adminsdk-fbsvc-55e5a0c2bd.json
 */

import {cert, initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {readFileSync} from "fs";
import {resolve} from "path";
import Papa from "papaparse";
import {csvRowToProduct} from "./csv-failsafe/mappers.js";
import {slugify} from "./csv-failsafe/slugify.js";
import type {CsvRow} from "./csv-failsafe/mappers.js";

// Paths are resolved relative to the project root (run script from there)
const SERVICE_ACCOUNT_PATH = resolve(
  process.cwd(),
  "functions/nazaris-feinkost-firebase-adminsdk-fbsvc-55e5a0c2bd.json",
);

const CSV_PATH = resolve(process.cwd(), "functions/product-list/Produktelist.csv");

const BATCH_SIZE = 499;

initializeApp({
  credential: cert(SERVICE_ACCOUNT_PATH),
});

const db = getFirestore();

// ─── Category helper ──────────────────────────────────────────────────────────

async function resolveCategories(categoryNames: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const batch = db.batch();

  for (const name of categoryNames) {
    const slug = slugify(name);
    const ref = db.collection("categories").doc(slug);
    batch.set(ref, {name, slug, order: 0, active: true}, {merge: true});
    result.set(name, slug);
  }

  await batch.commit();
  console.log(`[import] ✓ Resolved ${result.size} categories.`);
  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  console.log("[import] Reading CSV from:", CSV_PATH);
  const csvString = readFileSync(CSV_PATH, "utf-8");

  const {data: rows, errors} = Papa.parse<CsvRow>(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (errors.length > 0) {
    console.warn("[import] CSV parse warnings:", errors);
  }
  console.log(`[import] Parsed ${rows.length} rows.`);

  const uniqueCategories = [
    ...new Set(rows.map((r) => r.Kategorie?.trim()).filter(Boolean)),
  ] as string[];

  const categoryIds = await resolveCategories(uniqueCategories);

  let written = 0;
  let skipped = 0;

  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const batchRows = rows.slice(start, start + BATCH_SIZE);
    const batch = db.batch();

    for (let i = 0; i < batchRows.length; i++) {
      const row = batchRows[i];
      const rowIndex = start + i;

      if (!row.Produktname?.trim()) {
        console.warn(`[import] Row ${rowIndex}: empty Produktname — skipped.`);
        skipped++;
        continue;
      }

      try {
        const categoryId = categoryIds.get(row.Kategorie?.trim()) ?? "unknown";
        const product = csvRowToProduct(row, categoryId);
        batch.set(db.collection("products").doc(product.slug), product);
        written++;
      } catch (err) {
        console.error(`[import] Row ${rowIndex} (${row.Produktname}): mapping error — skipped.`, err);
        skipped++;
      }
    }

    await batch.commit();
    console.log(`[import] Batch committed (rows ${start}–${start + batchRows.length - 1}).`);
  }

  console.log(`\n[import] ✅ Done. Written: ${written}, Skipped: ${skipped}.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("[import] Fatal error:", err);
  process.exit(1);
});

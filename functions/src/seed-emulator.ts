/**
 * Seed script for local development against the Firebase Emulator Suite.
 *
 * What it does:
 *   1. Uploads product-list/Produktelist.csv to the Storage emulator
 *      at gs://default-bucket/backups/products.csv
 *   2. Deletes all documents in the Firestore emulator /products collection
 *
 * Run from the project root AFTER `firebase emulators:start`:
 *   npx ts-node --esm functions/src/seed-emulator.ts
 *
 * Or add a script to functions/package.json:
 *   "seed": "ts-node --esm src/seed-emulator.ts"
 */

// ── Must be set before firebase-admin is imported ─────────────────────────────
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
process.env.FIREBASE_STORAGE_EMULATOR_HOST = "localhost:9199";

import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import {readFileSync} from "fs";
import {resolve} from "path";
import {request} from "http";

// No credential needed — env vars above route all calls to the local emulators
initializeApp({
  projectId: "nazaris-feinkost",
  storageBucket: "nazaris-feinkost.firebasestorage.app",
});

const db = getFirestore();
const bucket = getStorage().bucket();

async function seed(): Promise<void> {
  // ── 1. Upload CSV to Storage emulator ──────────────────────────────────────
  // Resolve relative to the project root (run from there: npx ts-node --esm functions/src/seed-emulator.ts)
  const csvPath = resolve(process.cwd(), "functions", "product-list", "Produktelist.csv");
  console.log(`[seed] Reading CSV from: ${csvPath}`);

  const csvBuffer = readFileSync(csvPath);
  await bucket.file("backups/products.csv").save(csvBuffer, {
    resumable: false,
    contentType: "text/csv; charset=utf-8",
  });
  console.log("[seed] ✓ Uploaded backups/products.csv to Storage emulator.");

  // ── 2. Clear /products and /categories in Firestore emulator ──────────────
  const BATCH_SIZE = 499;

  for (const collectionName of ["products", "categories"]) {
    const snap = await db.collection(collectionName).get();
    if (snap.empty) {
      console.log(`[seed] ✓ /${collectionName} collection is already empty.`);
    } else {
      for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
        const batch = db.batch();
        snap.docs.slice(i, i + BATCH_SIZE).forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
      console.log(`[seed] ✓ Deleted ${snap.docs.length} documents from /${collectionName}.`);
    }
  }

  console.log("[seed] Seed complete. Now call checkAndRestoreProducts to import.");

  // ── 3. Call checkAndRestoreProducts automatically ─────────────────────────
  console.log("[seed] Calling checkAndRestoreProducts...");
  const result = await new Promise<string>((resolve, reject) => {
    const req = request(
      {
        hostname: "localhost",
        port: 5001,
        path: "/nazaris-feinkost/europe-west3/checkAndRestoreProducts",
        method: "GET",
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve(body));
      },
    );
    req.on("error", reject);
    req.end();
  });
  console.log(`[seed] ✓ Restore result: ${result}`);
}
seed().catch((err) => {
  console.error("[seed] Fatal error:", err);
  process.exit(1);
});

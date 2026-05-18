import {getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import Papa from "papaparse";
import {productToCsvRow} from "./mappers.js";
import type {ProductDocument} from "./mappers.js";
import {Timestamp} from "firebase-admin/firestore";

const FUNCTION_OPTIONS = {region: "europe-west3"};
const CSV_STORAGE_PATH = "backups/products.csv";

/**
 * Firestore trigger — fires on any create/update/delete in /products.
 * Re-exports the entire products collection to Storage as a CSV backup.
 * This keeps backups/products.csv always in sync with Firestore.
 */
export const exportProductsToCSV = onDocumentWritten(
  {document: "products/{productId}", ...FUNCTION_OPTIONS},
  async (event) => {
    console.log(
      `[exportToCSV] Triggered by write on products/${event.params.productId}.`,
    );

    try {
      const db = getFirestore();

      // ── 1. Read all products ──────────────────────────────────────────────
      const [productsSnap, categoriesSnap] = await Promise.all([
        db.collection("products").get(),
        db.collection("categories").get(),
      ]);

      // Guard: never overwrite the backup with an empty export.
      // This can happen when the seed script bulk-deletes all products and the
      // trigger fires before the new data is imported.
      if (productsSnap.size === 0) {
        console.log("[exportToCSV] Products collection is empty — skipping export to preserve backup.");
        return;
      }

      console.log(
        `[exportToCSV] Exporting ${productsSnap.size} products across ${categoriesSnap.size} categories.`,
      );

      // Build categoryId → name lookup
      const categoryNames = new Map<string, string>();
      categoriesSnap.docs.forEach((doc) => {
        categoryNames.set(doc.id, (doc.data().name as string) ?? doc.id);
      });

      // ── 2. Map each product document to a CSV row ─────────────────────────
      const rows: Record<string, string>[] = [];

      for (const doc of productsSnap.docs) {
        const data = doc.data() as Omit<ProductDocument, "createdAt">;
        try {
          rows.push(
            productToCsvRow({
              ...data,
              // Ensure mhd is a proper Timestamp or null
              mhd: data.mhd instanceof Timestamp ? data.mhd : null,
              categoryName: categoryNames.get(data.categoryId) ?? data.categoryId,
            }),
          );
        } catch (err) {
          console.error(`[exportToCSV] Skipping doc ${doc.id} ("${data.name}"):`, err);
        }
      }

      // ── 3. Serialise and upload ───────────────────────────────────────────
      const csvString = Papa.unparse(rows, {header: true});
      const buffer = Buffer.from(csvString, "utf-8");

      await getStorage().bucket().file(CSV_STORAGE_PATH).save(buffer, {
        resumable: false,
        contentType: "text/csv; charset=utf-8",
        metadata: {cacheControl: "no-cache, no-store"},
      });

      console.log(
        `[exportToCSV] Uploaded ${rows.length} rows to gs://…/${CSV_STORAGE_PATH}.`,
      );
    } catch (err) {
      console.error("[exportToCSV] Unexpected error:", err);
    }
  },
);

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Product } from "@/app/data/ProductList";
import { getFirebaseDb } from "./client";

export async function fetchAllProducts(): Promise<Product[]> {
  const db = getFirebaseDb();

  const [productsSnap, categoriesSnap] = await Promise.all([
    getDocs(query(collection(db, "products"), orderBy("name"))),
    getDocs(collection(db, "categories")),
  ]);

  const categoryMap = new Map<string, string>();
  const categoryTranslationsMap = new Map<string, Record<string, string>>();
  categoriesSnap.docs.forEach((doc) => {
    categoryMap.set(doc.id, (doc.data().name as string) ?? doc.id);
    if (doc.data().nameTranslations) {
      categoryTranslationsMap.set(doc.id, doc.data().nameTranslations as Record<string, string>);
    }
  });

  return productsSnap.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        categoryName: categoryMap.get(data.categoryId) ?? data.categoryId ?? "",
        categoryNameTranslations: categoryTranslationsMap.get(data.categoryId),
      } as Product;
    })
    .filter((p) => p.active);
}

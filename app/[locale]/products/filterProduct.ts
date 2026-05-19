import { Product } from "@/app/data/ProductList";
import { Timestamp } from "firebase/firestore";

// ─── Filter State ─────────────────────────────────────────────────────────────

export interface ProductFilters {
  category: string;
  spice: string;
  garlic: string;
  diet: string;
  availability: string;
}

export const DEFAULT_FILTERS: ProductFilters = {
  category: "all",
  spice: "all",
  garlic: "all",
  diet: "all",
  availability: "all",
};

export function isDefaultFilters(filters: ProductFilters): boolean {
  return (
    filters.category === "all" &&
    filters.spice === "all" &&
    filters.garlic === "all" &&
    filters.diet === "all" &&
    filters.availability === "all"
  );
}

// ─── Display Label Helpers ────────────────────────────────────────────────────

export function getSpicyLabel(level: 0 | 1 | 2): string {
  if (level === 2) return "Scharf";
  if (level === 1) return "Leicht scharf";
  return "Nicht scharf";
}

export function getGarlicLabel(level: 0 | 1 | 2): string {
  if (level === 2) return "Mit Knoblauch";
  if (level === 1) return "Wenig Knoblauch";
  return "Kein Knoblauch";
}

export function getMhdLabel(mhd: Timestamp | null, locale: string = "de"): string | null {
  if (!mhd) return null;
  const date = mhd.toDate();
  const localeStr = locale === "en" ? "en-GB" : "de-DE";
  return date.toLocaleDateString(localeStr, { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ─── Filter Function ──────────────────────────────────────────────────────────

export function filterProducts(
  products: Product[],
  filters: ProductFilters,
): Product[] {
  return products.filter((p) => {
    if (filters.category !== "all" && p.categoryId !== filters.category)
      return false;

    if (filters.spice === "spicy" && (p.filters?.spiceLevel ?? 0) === 0) return false;
    if (filters.spice === "mild" && (p.filters?.spiceLevel ?? 0) > 0) return false;

    if (filters.garlic === "withGarlic" && (p.filters?.knoblauch ?? 0) === 0)
      return false;
    if (filters.garlic === "withoutGarlic" && (p.filters?.knoblauch ?? 0) > 0)
      return false;

    if (filters.diet === "vegan" && p.filters?.dietType !== "vegan") return false;
    if (filters.diet === "notVegan" && p.filters?.dietType === "vegan") return false;

    return true;
  });
}

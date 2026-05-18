import { Product } from "@/app/data/ProductList";

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

// ─── Category Mapping ─────────────────────────────────────────────────────────

export const categoryKeyMap: Record<string, string> = {
  Oliven: "oliven",
  Antipasti: "antipasti",
  Hummus: "hummus",
  Pesto: "pesto",
  Cremes: "cremes",
};

// ─── Product Attribute Types ──────────────────────────────────────────────────

export type SpicyLevel = "not_spicy" | "little_spicy" | "spicy";
export type GarlicLevel = "no_garlic" | "little_garlic" | "with_garlic";
export type DietType = "vegan" | "vegetarian" | "dairy";
export type PriceUnit = "per_kg" | "per_piece";

// ─── Display Label Helpers ────────────────────────────────────────────────────

export function getSpicyLabel(level: SpicyLevel): string {
  switch (level) {
    case "spicy":        return "Scharf";
    case "little_spicy": return "Leicht scharf";
    case "not_spicy":    return "Nicht scharf";
  }
}

export function getGarlicLabel(level: GarlicLevel): string {
  switch (level) {
    case "with_garlic":   return "Mit Knoblauch";
    case "little_garlic": return "Wenig Knoblauch";
    case "no_garlic":     return "Kein Knoblauch";
  }
}

export function getShelfLifeLabel(days: number): string {
  if (days === 1) return "1 Tag";
  if (days < 7) return `${days} Tage`;
  if (days === 7) return "1 Woche";
  if (days < 14) return `${days} Tage`;
  if (days === 14) return "2 Wochen";
  if (days < 30) return `${days} Tage`;
  if (days === 30) return "1 Monat";
  return `${Math.floor(days / 30)} Monate`;
}

// ─── Ingredient Predicates ────────────────────────────────────────────────────

function hasChili(ingredients: string[]): boolean {
  return ingredients.some((ing) => ing.toLowerCase().includes("chili"));
}

function hasGarlic(ingredients: string[]): boolean {
  return ingredients.some(
    (ing) =>
      ing.toLowerCase().includes("knoblauch") ||
      ing.toLowerCase().includes("garlic"),
  );
}

// ─── Filter Function ──────────────────────────────────────────────────────────

export function filterProducts(
  products: Product[],
  filters: ProductFilters,
): Product[] {
  return products.filter((p) => {
    if (filters.category !== "all" && p.category !== filters.category)
      return false;

    if (filters.spice === "spicy" && !hasChili(p.ingredients)) return false;
    if (filters.spice === "mild" && hasChili(p.ingredients)) return false;

    if (filters.garlic === "withGarlic" && !hasGarlic(p.ingredients))
      return false;
    if (filters.garlic === "withoutGarlic" && hasGarlic(p.ingredients))
      return false;

    if (filters.diet === "vegan" && !p.isVegan) return false;
    if (filters.diet === "notVegan" && p.isVegan) return false;

    return true;
  });
}

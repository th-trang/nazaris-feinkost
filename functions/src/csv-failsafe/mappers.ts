import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {slugify} from "./slugify.js";

// ─── CSV row shape (papaparse header: true) ───────────────────────────────────

export interface CsvRow {
  Produktname: string;
  Kategorie: string;
  Beschreibung: string;
  Zutaten: string; // semicolon-separated, may be absent in older CSVs
  Bilder: string; // image URL
  Allergien: string; // comma-separated groups: "gluten,dairy,nuts"
  Scharf: string;
  "Knoblauchintensität": string;
  Ernährungsform: string;
  Preiseinheit: string;
  Preis: string;
  Saisonal: string;
  "Verfügbarkeitszeitraum": string;
  Mindesthaltbarkeit: string;
  // Written by exportToCSV so a restore round-trips faithfully. Absent from the
  // hand-maintained Produktelist.csv, hence optional — see the defaults below.
  Aktiv?: string;
  Textur?: string;
  "NameÜbersetzungen"?: string; // JSON: {"en": "...", "vi": "..."}
  "BeschreibungÜbersetzungen"?: string; // JSON, same shape
}

// ─── Firestore document shape ─────────────────────────────────────────────────

export interface ProductIngredient {
  name: string;
  isAllergen: boolean;
  allergenGroup: string; // "gluten" | "dairy" | "nuts" | ""
  order: number;
}

export interface ProductFilters {
  dietType: "vegan" | "veggie" | "dairy";
  knoblauch: 0 | 1 | 2;
  spiceLevel: 0 | 1 | 2;
  containsNuts: boolean;
  containsGluten: boolean;
  texture: "liquid" | "creamy" | "chunky";
}

export interface ProductDocument {
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  price: number;
  priceUnit: "100g" | "stueck";
  imageUrl: string | null;
  mhd: Timestamp | null;
  availableFrom: string | null;
  availableTo: string | null;
  active: boolean;
  ingredients: ProductIngredient[];
  filters: ProductFilters;
  discount: null;
  createdAt: FieldValue;
  nameTranslations?: Record<string, string>;
  descriptionTranslations?: Record<string, string>;
}

// ─── CSV → Firestore mapping ──────────────────────────────────────────────────

export function csvRowToProduct(row: CsvRow, categoryId: string): ProductDocument {
  const price = parsePrice(row.Preis);
  const allergenGroups = parseAllergenGroups(row.Allergien);
  const {availableFrom, availableTo} = mapAvailability(row.Saisonal, row["Verfügbarkeitszeitraum"]);
  const nameTranslations = parseTranslations(row["NameÜbersetzungen"], row.Produktname);
  const descriptionTranslations = parseTranslations(
    row["BeschreibungÜbersetzungen"],
    row.Produktname,
  );

  return {
    name: row.Produktname.trim(),
    slug: slugify(row.Produktname),
    categoryId,
    description: row.Beschreibung?.trim() ?? "",
    price,
    priceUnit: mapPriceUnit(row.Preiseinheit),
    imageUrl: parseImageUrl(row.Bilder),
    mhd: mapMhd(row.Mindesthaltbarkeit),
    availableFrom,
    availableTo,
    active: parseActive(row.Aktiv),
    ingredients: mapIngredients(row.Zutaten ?? "", allergenGroups),
    filters: {
      dietType: mapDietType(row.Ernährungsform),
      knoblauch: mapKnoblauch(row["Knoblauchintensität"]),
      spiceLevel: mapSpiceLevel(row.Scharf),
      containsNuts: allergenGroups.includes("nuts"),
      containsGluten: allergenGroups.includes("gluten"),
      texture: mapTexture(row.Textur),
    },
    discount: null,
    createdAt: FieldValue.serverTimestamp(),
    // Omit the keys entirely when absent — Firestore rejects undefined values.
    ...(nameTranslations ? {nameTranslations} : {}),
    ...(descriptionTranslations ? {descriptionTranslations} : {}),
  };
}

// ─── Firestore → CSV row mapping (for export) ─────────────────────────────────

export function productToCsvRow(
  doc: Omit<ProductDocument, "createdAt" | "discount"> & {categoryName: string},
): Record<string, string> {
  const seasonal = doc.availableFrom !== null && doc.availableTo !== null;
  const mhdStr =
    doc.mhd instanceof Timestamp
      ? formatDate(doc.mhd.toDate())
      : "";

  return {
    Produktname: doc.name,
    Kategorie: doc.categoryName,
    Beschreibung: doc.description,
    Bilder: doc.imageUrl ?? "",
    Zutaten: doc.ingredients.map((i) => i.name).join(";"),
    Allergien: buildAllergenString(doc.ingredients, doc.filters),
    Scharf: reverseSpiceLevel(doc.filters.spiceLevel),
    "Knoblauchintensität": reverseKnoblauch(doc.filters.knoblauch),
    Ernährungsform: reverseDietType(doc.filters.dietType),
    Preiseinheit: doc.priceUnit === "stueck" ? "Stück" : "100 Gramm",
    Preis: String(doc.price).replace(".", ","),
    Saisonal: seasonal ? "Ja" : "Nein",
    "Verfügbarkeitszeitraum":
      seasonal ? `${doc.availableFrom} bis ${doc.availableTo}` : "",
    Mindesthaltbarkeit: mhdStr,
    Aktiv: doc.active ? "Ja" : "Nein",
    Textur: doc.filters.texture,
    "NameÜbersetzungen": serialiseTranslations(doc.nameTranslations),
    "BeschreibungÜbersetzungen": serialiseTranslations(doc.descriptionTranslations),
  };
}

// ─── Field parsers ────────────────────────────────────────────────────────────

// Some CSV rows pack multiple comma-separated URLs into one cell; use the first.
function parseImageUrl(raw: string | undefined | null): string | null {
  if (!raw || !raw.trim()) return null;
  return raw.split(",")[0].trim() || null;
}

function parsePrice(raw: string | undefined | null): number {  if (!raw || !raw.trim()) return 0; // price not yet set in CSV
  const normalised = raw.trim().replace(",", ".");
  const n = parseFloat(normalised);
  if (isNaN(n)) throw new Error(`Invalid price: "${raw}"`);
  return n;
}

// Absent column (hand-maintained CSV) means "visible" — matches the old hardcoded true.
function parseActive(raw: string | undefined | null): boolean {
  if (!raw || !raw.trim()) return true;
  const v = raw.trim().toLowerCase();
  return !(v === "nein" || v === "no" || v === "false" || v === "0");
}

function mapTexture(raw: string | undefined | null): "liquid" | "creamy" | "chunky" {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "liquid" || v === "flüssig" || v === "fluessig") return "liquid";
  if (v === "chunky" || v === "stückig" || v === "stueckig") return "chunky";
  return "creamy";
}

/**
 * Translations live on the product doc as {locale: text} and are read by
 * ProductCard. They are stored in the CSV as a single JSON cell so a restore
 * does not silently drop them. Malformed JSON degrades to "no translations"
 * rather than failing the whole row.
 */
function parseTranslations(
  raw: string | undefined | null,
  productName: string,
): Record<string, string> | undefined {
  if (!raw || !raw.trim()) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn(`[mappers] "${productName}": malformed translations JSON — ignored.`);
    return undefined;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    console.warn(`[mappers] "${productName}": translations must be an object — ignored.`);
    return undefined;
  }
  const out: Record<string, string> = {};
  for (const [locale, text] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof text === "string" && text.trim()) out[locale] = text;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function serialiseTranslations(value: Record<string, string> | undefined): string {
  if (!value || Object.keys(value).length === 0) return "";
  return JSON.stringify(value);
}

function parseAllergenGroups(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function mapSpiceLevel(raw: string): 0 | 1 | 2 {
  const v = raw.trim().toLowerCase();
  if (v === "" || v === "nein") return 0;
  // "scharf" alone = fully spicy; "leicht scharf" | "wenig" = little
  if (v === "scharf") return 2;
  return 1; // "leicht scharf", "wenig", etc.
}

function mapKnoblauch(raw: string): 0 | 1 | 2 {
  const v = raw.trim().toLowerCase();
  if (v === "" || v.includes("ohne") || v.includes("kein")) return 0;
  if (v.includes("hauch") || v.includes("wenig")) return 1;
  return 2; // "mit knoblauch", "viel"
}

function mapDietType(raw: string): "vegan" | "veggie" | "dairy" {
  const v = raw.trim().toLowerCase();
  if (v.startsWith("vegan")) return "vegan";
  if (v.startsWith("vegetar") || v.startsWith("veggie")) return "veggie";
  return "dairy"; // "diary", "dairy", "mit milch"
}

function mapPriceUnit(raw: string): "100g" | "stueck" {
  const v = raw.trim().toLowerCase();
  if (v.includes("stück") || v.includes("stueck") || v === "piece") return "stueck";
  return "100g"; // "100 gramm", default
}

function mapMhd(raw: string | undefined | null): Timestamp | null {
  if (!raw || !raw.trim()) return null;
  // Expected: DD.MM.YYYY — values like "3 Tage" are returned as null (no fixed expiry date)
  const match = raw.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  if (isNaN(date.getTime())) return null;
  return Timestamp.fromDate(date);
}

function mapAvailability(
  saisonal: string | undefined,
  zeitraum: string | undefined,
): {availableFrom: string | null; availableTo: string | null} {
  if (!saisonal || saisonal.trim().toLowerCase() !== "ja") {
    return {availableFrom: null, availableTo: null};
  }
  const zeitraumTrimmed = (zeitraum ?? "").trim();
  const parts = zeitraumTrimmed.split(" bis ");
  if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
    return {
      availableFrom: parts[0].trim(),
      availableTo: parts[1].trim(),
    };
  }
  // Seasonal but no date range — store the season label (e.g. "Sommer") or a fallback
  const label = zeitraumTrimmed || "saisonal";
  return {availableFrom: label, availableTo: label};
}

function mapIngredients(zutaten: string, allergenGroups: string[]): ProductIngredient[] {
  if (!zutaten.trim()) return [];
  return zutaten
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name, index) => {
      const nameLower = name.toLowerCase();
      const matchedGroup = allergenGroups.find(
        (g) => nameLower.includes(g) || g.includes(nameLower.split(" ")[0]),
      ) ?? "";
      return {
        name,
        isAllergen: matchedGroup !== "",
        allergenGroup: matchedGroup,
        order: index,
      };
    });
}

// ─── Reverse mappers (Firestore → CSV) ───────────────────────────────────────

function reverseSpiceLevel(level: 0 | 1 | 2): string {
  if (level === 2) return "Scharf";
  if (level === 1) return "leicht Scharf";
  return "Nein";
}

function reverseKnoblauch(level: 0 | 1 | 2): string {
  if (level === 2) return "mit Knoblauch";
  if (level === 1) return "Hauch Knoblauch";
  return "ohne Knoblauch";
}

function reverseDietType(type: "vegan" | "veggie" | "dairy"): string {
  if (type === "vegan") return "Vegan";
  if (type === "veggie") return "Vegetarian";
  return "Diary";
}

function buildAllergenString(
  ingredients: ProductIngredient[],
  filters: ProductFilters,
): string {
  const groups = new Set<string>();
  ingredients.forEach((i) => {
    if (i.isAllergen && i.allergenGroup) groups.add(i.allergenGroup);
  });
  if (filters.containsNuts) groups.add("nuts");
  if (filters.containsGluten) groups.add("gluten");
  return [...groups].join(",");
}

function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

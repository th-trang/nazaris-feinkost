/**
 * Converts a product or category name to a URL-safe slug.
 * Handles German umlauts: ä→ae, ö→oe, ü→ue, ß→ss
 * Spaces → hyphens, all other non-alphanumeric characters stripped.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Transforms a human-readable school name into a URL-friendly slug.
 */
export function generateSchoolSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "school";
}

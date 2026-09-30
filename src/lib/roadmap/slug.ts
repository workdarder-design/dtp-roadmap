/**
 * Convert a client name into a URL-friendly slug.
 * Supports Latin and Arabic letters; strips other punctuation.
 *
 * Ahmed Mohamed → ahmed-mohamed
 * أحمد محمد → أحمد-محمد
 */
export function slugifyClientName(name: string): string {
  return name
    .trim()
    .normalize("NFKC")
    .toLowerCase()
    // Keep Latin letters/digits, Arabic letters, and spaces/hyphens
    .replace(/[^\p{L}\p{N}\s-]+/gu, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

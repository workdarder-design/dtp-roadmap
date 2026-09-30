/** User-facing product name shown in headers, titles, and exports. */
export const ROADMAP_PRODUCT_NAME = "DTP— Roadmap";

/** Client-facing title; collapses duplicate branding such as "DCAA — DTP— Roadmap". */
export function clientRoadmapTitle(clientName?: string | null): string {
  const name = clientName?.trim();
  if (!name) return ROADMAP_PRODUCT_NAME;
  if (/^dcaa$/i.test(name)) return ROADMAP_PRODUCT_NAME;
  const combined = `${name} — ${ROADMAP_PRODUCT_NAME}`;
  if (/^dcaa\s*[—–-]\s*dtp—\s*roadmap$/i.test(combined.replace(/\s+/g, " ").trim())) {
    return ROADMAP_PRODUCT_NAME;
  }
  return combined;
}

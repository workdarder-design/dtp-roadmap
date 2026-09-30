import { slugifyClientName } from "./slug";

export interface Consultation {
  /** Internal identifier — never shown in client-facing URLs. */
  id: string;
  clientName: string;
  /** URL slug derived from client name only (no IDs). */
  slug: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

/**
 * Resolve a consultation by client-name slug from an in-memory list.
 * Duplicate names share the same slug; pick the most recently updated.
 */
export function findConsultationBySlug(slug: string, list: Consultation[]): Consultation | null {
  const matches = list.filter((c) => c.slug === slug);
  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
}

/** Client-facing URL contains only the client-name slug — never an ID/UUID. */
export function consultationShareUrl(slug: string) {
  const path = `/consultation/${slug}`;
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export { slugifyClientName };

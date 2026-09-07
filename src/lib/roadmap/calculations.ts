import type { RoadmapFilterState, RoadmapItem } from "./types";

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const isCompleted = (i: RoadmapItem) =>
  i.devStatus === "Done" &&
  (i.deliveryStatus === "Completed" ||
    i.deliveryStatus === "Production" ||
    i.deliveryStatus === "Handover (to Client)" ||
    i.businessStatus === "Completed");

export const isBlocked = (i: RoadmapItem) => i.devStatus === "Blocked" || i.businessStatus === "On Hold";

export const isInProgress = (i: RoadmapItem) => !isCompleted(i) && !isBlocked(i) && i.devStatus === "In Progress";

export const isDelayed = (i: RoadmapItem) => {
  if (isCompleted(i)) return false;
  const eta = i.etaProduction ?? i.etaStaging;
  return !!eta && eta < todayISO();
};

export const isStagingReady = (i: RoadmapItem) => !!i.etaStaging && i.devStatus === "Done";

export const isProductionReady = (i: RoadmapItem) =>
  !!i.etaProduction || i.deliveryStatus === "Production" || i.deliveryStatus === "Completed";

export const isPendingClient = (i: RoadmapItem) =>
  i.deliveryStatus === "Handover (to Client)" ||
  i.deliveryStatus === "UAT" ||
  i.deliveryStatus === "Ready for UAT";

export type DerivedState = "Completed" | "Blocked" | "Delayed" | "In Progress" | "Planned";

export const derivedState = (i: RoadmapItem): DerivedState => {
  if (isCompleted(i)) return "Completed";
  if (isBlocked(i)) return "Blocked";
  if (isDelayed(i)) return "Delayed";
  if (isInProgress(i)) return "In Progress";
  return "Planned";
};

export interface RoadmapKpiSet {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  delayed: number;
  stagingReady: number;
  productionReady: number;
  pendingClient: number;
  completionPct: number;
}

export function computeKpis(items: RoadmapItem[]): RoadmapKpiSet {
  const count = (fn: (i: RoadmapItem) => boolean) => items.filter(fn).length;
  const completed = count(isCompleted);
  return {
    total: items.length,
    completed,
    inProgress: count(isInProgress),
    blocked: count(isBlocked),
    delayed: count(isDelayed),
    stagingReady: count(isStagingReady),
    productionReady: count(isProductionReady),
    pendingClient: count(isPendingClient),
    completionPct: items.length ? Math.round((completed / items.length) * 100) : 0,
  };
}

export function applyFilters(items: RoadmapItem[], f: RoadmapFilterState): RoadmapItem[] {
  return items.filter((i) => {
    if (f.scopeType === "module" && f.scopeValue && i.module !== f.scopeValue) return false;
    if (f.scopeType === "feature" && f.scopeValue && i.feature !== f.scopeValue) return false;
    if (f.scopeType === "sprint" && f.scopeValue && i.sprint !== f.scopeValue) return false;
    if (f.scopeType === "pi" && f.scopeValue && i.pi !== f.scopeValue) return false;
    if (f.pi !== "all" && i.pi !== f.pi) return false;
    if (f.sprint !== "all" && i.sprint !== f.sprint) return false;
    if (f.module !== "all" && i.module !== f.module) return false;
    if (f.priority !== "all" && i.priority !== f.priority) return false;
    if (f.status !== "all" && derivedState(i) !== f.status) return false;
    if (f.businessStatus !== "all" && (i.businessStatus || "Unset") !== f.businessStatus) return false;
    if (f.devStatus !== "all" && (i.devStatus || "Unset") !== f.devStatus) return false;
    if (f.deliveryStatus !== "all" && (i.deliveryStatus || "Unset") !== f.deliveryStatus) return false;
    if (f.etaFrom || f.etaTo) {
      const eta = i.etaProduction ?? i.etaStaging;
      if (!eta) return false;
      if (f.etaFrom && eta < f.etaFrom) return false;
      if (f.etaTo && eta > f.etaTo) return false;
    }
    if (f.search.trim()) {
      const q = f.search.toLowerCase();
      const hay = [i.id, i.module, i.feature, i.sprint, i.remarks, i.businessStatus, i.devStatus, i.deliveryStatus]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function groupCount<T extends string>(items: RoadmapItem[], key: (i: RoadmapItem) => T) {
  const map = new Map<string, number>();
  for (const i of items) {
    const k = key(i) || "Unset";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map, ([name, value]) => ({ name, value }));
}

export function formatDate(iso: string | null) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function daysUntil(iso: string): number {
  const ms = new Date(iso + "T00:00:00").getTime() - new Date(todayISO() + "T00:00:00").getTime();
  return Math.round(ms / 86400000);
}

/** Closest upcoming (or nearest past, if none upcoming) non-completed delivery. */
export function nextDelivery(items: RoadmapItem[]): RoadmapItem | null {
  const dated = items.filter((i) => !isCompleted(i) && (i.etaProduction ?? i.etaStaging));
  if (!dated.length) return null;
  const eta = (i: RoadmapItem) => (i.etaProduction ?? i.etaStaging)!;
  const upcoming = dated.filter((i) => eta(i) >= todayISO());
  const pool = upcoming.length ? upcoming : dated;
  return pool.sort((a, b) => eta(a).localeCompare(eta(b)))[0] ?? null;
}

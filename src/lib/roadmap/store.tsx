import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SEED_ITEMS } from "./seed";
import { DEFAULT_FILTERS, type RoadmapFilterState, type RoadmapItem } from "./types";
import { applyFilters } from "./calculations";

const STORAGE_KEY = "dcaa-roadmap-v1";

export type Role = "admin" | "viewer";

interface RoadmapContextValue {
  items: RoadmapItem[];
  filtered: RoadmapItem[];
  filters: RoadmapFilterState;
  setFilters: (patch: Partial<RoadmapFilterState>) => void;
  resetFilters: () => void;
  hydrated: boolean;
  role: Role;
  setRole: (r: Role) => void;
  isAdmin: boolean;
  addItem: (item: RoadmapItem) => void;
  updateItem: (id: string, patch: Partial<RoadmapItem>) => void;
  deleteItems: (ids: string[]) => void;
  nextId: () => string;
}

// Keep a single context instance even if this module is evaluated twice
// (dev HMR / route code-splitting can create duplicate module instances).
const globalStore = globalThis as typeof globalThis & {
  __dcaaRoadmapContext?: React.Context<RoadmapContextValue | null>;
};
const RoadmapContext =
  globalStore.__dcaaRoadmapContext ??
  (globalStore.__dcaaRoadmapContext = createContext<RoadmapContextValue | null>(null));

export function RoadmapProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RoadmapItem[]>(SEED_ITEMS);
  const [filters, setFiltersState] = useState<RoadmapFilterState>(DEFAULT_FILTERS);
  const [role, setRole] = useState<Role>("admin");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as RoadmapItem[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  const setFilters = useCallback((patch: Partial<RoadmapFilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo<RoadmapContextValue>(() => {
    return {
      items,
      filtered: applyFilters(items, filters),
      filters,
      setFilters,
      resetFilters: () => setFiltersState(DEFAULT_FILTERS),
      hydrated,
      role,
      setRole,
      isAdmin: role === "admin",
      addItem: (item) => setItems((prev) => [...prev, item]),
      updateItem: (id, patch) =>
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i))),
      deleteItems: (ids) => setItems((prev) => prev.filter((i) => !ids.includes(i.id))),
      nextId: () => {
        const max = items.reduce((acc, i) => {
          const n = Number(i.id.split("-")[1]);
          return Number.isFinite(n) ? Math.max(acc, n) : acc;
        }, 0);
        return `DCAA-${String(max + 1).padStart(3, "0")}`;
      },
    };
  }, [items, filters, setFilters, hydrated, role]);

  return <RoadmapContext.Provider value={value}>{children}</RoadmapContext.Provider>;
}

export function useRoadmap() {
  const ctx = useContext(RoadmapContext);
  if (!ctx) throw new Error("useRoadmap must be used inside RoadmapProvider");
  return ctx;
}

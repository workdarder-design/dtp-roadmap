import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  DEFAULT_FILTERS,
  DEFAULT_MODULES,
  DEFAULT_SPRINTS,
  normalizeModule,
  type RoadmapFilterState,
  type RoadmapItem,
} from "./types";
import { fetchProgramModules, fetchProgramSprints } from "@/lib/services/programConfig";
import { applyFilters } from "./calculations";
import { useAuth } from "@/lib/auth/store";
import {
  deleteRoadmapItems,
  fetchRoadmapItems,
  insertRoadmapItem,
  nextRoadmapItemId,
  updateRoadmapItem,
} from "@/lib/services/roadmapItems";
import { updateProfileRole } from "@/lib/services/profiles";
import type { UserRole } from "@/lib/supabase/database.types";

export type Role = UserRole;

interface RoadmapContextValue {
  items: RoadmapItem[];
  filtered: RoadmapItem[];
  filters: RoadmapFilterState;
  setFilters: (patch: Partial<RoadmapFilterState>) => void;
  resetFilters: () => void;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  role: Role;
  setRole: (r: Role) => void;
  isAdmin: boolean;
  addItem: (item: RoadmapItem) => Promise<void>;
  updateItem: (id: string, patch: Partial<RoadmapItem>) => Promise<void>;
  deleteItems: (ids: string[]) => Promise<void>;
  nextId: () => string;
  modules: string[];
  sprints: string[];
  refreshProgramConfig: () => Promise<void>;
}

const globalStore = globalThis as typeof globalThis & {
  __dcaaRoadmapContext?: React.Context<RoadmapContextValue | null>;
};
const RoadmapContext =
  globalStore.__dcaaRoadmapContext ??
  (globalStore.__dcaaRoadmapContext = createContext<RoadmapContextValue | null>(null));

export function RoadmapProvider({ children }: { children: ReactNode }) {
  const { profile, user, refreshProfile } = useAuth();
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [filters, setFiltersState] = useState<RoadmapFilterState>(DEFAULT_FILTERS);
  const [role, setRoleState] = useState<Role>("admin");
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [idCounter, setIdCounter] = useState("DCAA-001");
  const [modules, setModules] = useState<string[]>([...DEFAULT_MODULES]);
  const [sprints, setSprints] = useState<string[]>([...DEFAULT_SPRINTS]);

  useEffect(() => {
    if (profile?.role) {
      setRoleState(profile.role);
    } else if (!user) {
      setRoleState("admin");
    }
  }, [profile?.role, user]);

  const refreshProgramConfig = useCallback(async () => {
    try {
      const [m, s] = await Promise.all([fetchProgramModules(), fetchProgramSprints()]);
      setModules(m);
      setSprints(s);
    } catch {
      setModules([...DEFAULT_MODULES]);
      setSprints([...DEFAULT_SPRINTS]);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchRoadmapItems();
      setItems(list.map((i) => ({ ...i, module: normalizeModule(i.module) })));
      const next = await nextRoadmapItemId(list);
      setIdCounter(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load roadmap";
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    void refreshProgramConfig();
  }, [refresh, refreshProgramConfig]);

  const setFilters = useCallback((patch: Partial<RoadmapFilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setRole = useCallback(
    (r: Role) => {
      setRoleState(r);
      if (!user?.id) return;
      void updateProfileRole(user.id, r)
        .then(() => refreshProfile())
        .catch((err) => {
          toast.error(err instanceof Error ? err.message : "Could not update role");
        });
    },
    [user?.id, refreshProfile],
  );

  const addItem = useCallback(async (item: RoadmapItem) => {
    const created = await insertRoadmapItem(item);
    setItems((prev) => [...prev, { ...created, module: normalizeModule(created.module) }]);
    const next = await nextRoadmapItemId([...items, created]);
    setIdCounter(next);
  }, [items]);

  const updateItem = useCallback(async (id: string, patch: Partial<RoadmapItem>) => {
    const updated = await updateRoadmapItem(id, patch);
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...updated, module: normalizeModule(updated.module) } : i,
      ),
    );
  }, []);

  const deleteItemsHandler = useCallback(async (ids: string[]) => {
    await deleteRoadmapItems(ids);
    setItems((prev) => prev.filter((i) => !ids.includes(i.id)));
  }, []);

  const value = useMemo<RoadmapContextValue>(() => {
    return {
      items,
      filtered: applyFilters(items, filters),
      filters,
      setFilters,
      resetFilters: () => setFiltersState(DEFAULT_FILTERS),
      hydrated,
      loading,
      error,
      refresh,
      role,
      setRole,
      isAdmin: role === "admin",
      addItem: async (item) => {
        try {
          await addItem(item);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Could not add item");
          throw err;
        }
      },
      updateItem: async (id, patch) => {
        try {
          await updateItem(id, patch);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Could not save changes");
          throw err;
        }
      },
      deleteItems: async (ids) => {
        try {
          await deleteItemsHandler(ids);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Could not delete items");
          throw err;
        }
      },
      nextId: () => idCounter,
      modules,
      sprints,
      refreshProgramConfig,
    };
  }, [
    items,
    filters,
    setFilters,
    hydrated,
    loading,
    error,
    refresh,
    role,
    setRole,
    addItem,
    updateItem,
    deleteItemsHandler,
    idCounter,
    modules,
    sprints,
    refreshProgramConfig,
  ]);

  return <RoadmapContext.Provider value={value}>{children}</RoadmapContext.Provider>;
}

export function useRoadmap() {
  const ctx = useContext(RoadmapContext);
  if (!ctx) throw new Error("useRoadmap must be used inside RoadmapProvider");
  return ctx;
}

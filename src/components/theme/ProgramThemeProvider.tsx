import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { applyProgramTheme, type ProgramThemeColors } from "@/lib/theme/applyProgramTheme";
import { fetchProgramTheme, updateProgramTheme as persistProgramTheme } from "@/lib/services/appSettings";
import { readStatusDoneColor } from "@/lib/theme/readStatusDoneColor";

interface ProgramThemeContextValue {
  theme: ProgramThemeColors;
  statusDoneColor: string;
  hydrated: boolean;
  refreshTheme: () => Promise<void>;
  saveTheme: (patch: ProgramThemeColors) => Promise<void>;
}

const ProgramThemeContext = createContext<ProgramThemeContextValue | null>(null);

export function ProgramThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ProgramThemeColors>({
    statusDoneLight: null,
    statusDoneDark: null,
  });
  const [hydrated, setHydrated] = useState(false);
  const [statusDoneColor, setStatusDoneColor] = useState(readStatusDoneColor);

  const refreshTheme = useCallback(async () => {
    try {
      const next = await fetchProgramTheme();
      setTheme(next);
      applyProgramTheme(next);
      setStatusDoneColor(readStatusDoneColor());
    } catch {
      applyProgramTheme({ statusDoneLight: null, statusDoneDark: null });
      setStatusDoneColor(readStatusDoneColor());
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    void refreshTheme();
  }, [refreshTheme]);

  const saveTheme = useCallback(
    async (patch: ProgramThemeColors) => {
      const saved = await persistProgramTheme(patch);
      setTheme(saved);
      applyProgramTheme(saved);
      setStatusDoneColor(readStatusDoneColor());
    },
    [],
  );

  const value = useMemo(
    () => ({ theme, statusDoneColor, hydrated, refreshTheme, saveTheme }),
    [theme, statusDoneColor, hydrated, refreshTheme, saveTheme],
  );

  return <ProgramThemeContext.Provider value={value}>{children}</ProgramThemeContext.Provider>;
}

export function useProgramTheme() {
  const ctx = useContext(ProgramThemeContext);
  if (!ctx) throw new Error("useProgramTheme must be used inside ProgramThemeProvider");
  return ctx;
}

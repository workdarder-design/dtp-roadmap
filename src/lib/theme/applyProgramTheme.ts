import { DEFAULT_STATUS_DONE_DARK, DEFAULT_STATUS_DONE_LIGHT } from "./defaults";

export interface ProgramThemeColors {
  statusDoneLight: string | null;
  statusDoneDark: string | null;
}

const STYLE_ID = "program-theme-overrides";

export function applyProgramTheme(colors: ProgramThemeColors): void {
  if (typeof document === "undefined") return;

  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }

  const light = colors.statusDoneLight?.trim() || null;
  const dark = colors.statusDoneDark?.trim() || null;

  if (!light && !dark) {
    el.textContent = "";
    document.documentElement.style.removeProperty("--status-done");
    return;
  }

  const rootRule = light ? `--status-done: ${light};` : `--status-done: ${DEFAULT_STATUS_DONE_LIGHT};`;
  const darkRule = dark
    ? `--status-done: ${dark};`
    : light
      ? `--status-done: ${light};`
      : `--status-done: ${DEFAULT_STATUS_DONE_DARK};`;

  el.textContent = `:root { ${rootRule} }\n.dark { ${darkRule} }`;
}

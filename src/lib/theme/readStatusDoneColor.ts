import { DEFAULT_STATUS_DONE_LIGHT } from "./defaults";

/** Resolved `--status-done` for charts and inline styles. */
export function readStatusDoneColor(): string {
  if (typeof document === "undefined") return DEFAULT_STATUS_DONE_LIGHT;
  const v = getComputedStyle(document.documentElement).getPropertyValue("--status-done").trim();
  return v || DEFAULT_STATUS_DONE_LIGHT;
}

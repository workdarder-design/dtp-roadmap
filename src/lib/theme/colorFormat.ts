import { DEFAULT_STATUS_DONE_HEX } from "./defaults";

const CSS_COLOR =
  /^(oklch\([^)]+\)|#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|hsl\([^)]+\))$/;

export function isValidCssColor(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (!CSS_COLOR.test(v)) return false;
  if (typeof document === "undefined") return true;
  const el = document.createElement("div");
  el.style.color = v;
  return el.style.color !== "";
}

/** Normalize `#abc` → `#aabbcc`. */
export function normalizeHex(hex: string): string {
  const h = hex.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(h)) {
    return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return h;
}

export function cssColorToHex(color: string): string {
  const trimmed = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) return normalizeHex(trimmed);
  if (typeof document === "undefined") return DEFAULT_STATUS_DONE_HEX;

  const el = document.createElement("div");
  el.style.color = trimmed;
  el.style.display = "none";
  document.documentElement.appendChild(el);
  const computed = getComputedStyle(el).color;
  el.remove();

  const parts = computed.match(/\d+/g);
  if (!parts || parts.length < 3) return DEFAULT_STATUS_DONE_HEX;
  return (
    "#" +
    parts
      .slice(0, 3)
      .map((n) => Number(n).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Public share URLs use a short code: 4–5 lowercase letters or digits. */
export const SHARE_CODE_MIN = 4;
export const SHARE_CODE_MAX = 5;

export const SHARE_CODE_PATTERN = /^[a-z0-9]{4,5}$/;

export function normalizeShareCode(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidShareCode(raw: string): boolean {
  return SHARE_CODE_PATTERN.test(normalizeShareCode(raw));
}

const CHARSET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function randomShareCode(length = SHARE_CODE_MAX): string {
  const n = Math.min(SHARE_CODE_MAX, Math.max(SHARE_CODE_MIN, length));
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join("");
}

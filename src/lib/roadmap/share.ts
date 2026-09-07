const TOKEN_KEY = "dcaa-roadmap-share-token";

function randomToken() {
  const bytes = new Uint8Array(24);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Returns the current public share token, creating one on first use. */
export function getShareToken(): string {
  if (typeof localStorage === "undefined") return "";
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = randomToken();
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

export function rotateShareToken(): string {
  if (typeof localStorage === "undefined") return "";
  const token = randomToken();
  localStorage.setItem(TOKEN_KEY, token);
  return token;
}

export function shareUrl(token: string) {
  if (typeof window === "undefined") return `/share/${token}`;
  return `${window.location.origin}/share/${token}`;
}

/** Remarks are internal unless explicitly flagged for the client. */
const CLIENT_PREFIX = /^\s*\[client\]\s*/i;
export const isClientVisibleRemark = (remark: string) => CLIENT_PREFIX.test(remark ?? "");
export const clientRemark = (remark: string) =>
  isClientVisibleRemark(remark) ? remark.replace(CLIENT_PREFIX, "") : "";

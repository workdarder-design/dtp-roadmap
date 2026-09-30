export function shareUrl(token: string) {
  if (typeof window === "undefined") return `/share/${token}`;
  return `${window.location.origin}/share/${token}`;
}

/** Remarks are internal unless explicitly flagged for the client. */
const CLIENT_PREFIX = /^\s*\[client\]\s*/i;
export const isClientVisibleRemark = (remark: string) => CLIENT_PREFIX.test(remark ?? "");
export const clientRemark = (remark: string) =>
  isClientVisibleRemark(remark) ? remark.replace(CLIENT_PREFIX, "") : "";

// Secure random access hash for QR codes. The QR image only ever contains a URL
// with this hash, never personal information.

export function generateAccessHash(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  let bin = "";
  arr.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** The address a scanner opens. Set NEXT_PUBLIC_APP_URL in production (e.g. https://bewachen.app). */
export function buildReadUrl(hash: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base.replace(/\/+$/, "")}/read/${hash}`;
}

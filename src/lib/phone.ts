/** Keep only a leading "+" and the digits, so "+971 (50) 123-4567" becomes "+971501234567". */
export function toDialable(raw: string): string {
  const trimmed = raw.trim();
  return (trimmed.startsWith("+") ? "+" : "") + trimmed.replace(/\D/g, "");
}

export function isDialable(raw: string): boolean {
  return toDialable(raw).replace("+", "").length >= 3;
}

export function toTelHref(raw: string): string {
  return `tel:${toDialable(raw)}`;
}

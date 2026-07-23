/**
 * Fetch/Response Headers reject non-ByteString values. Collapse Unicode
 * ellipsis and replace other non-ASCII with `?`, then truncate with `...`.
 */
export function toAsciiHeaderValue(value: string, maxLen = 480): string {
  const ascii = value
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\x7E]/g, "?");
  if (ascii.length <= maxLen) return ascii;
  const keep = Math.max(0, maxLen - 3);
  return `${ascii.slice(0, keep)}...`;
}

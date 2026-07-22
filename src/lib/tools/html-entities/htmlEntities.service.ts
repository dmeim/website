/**
 * Escape / unescape HTML entities.
 * Parity with it-tools html-entities (lodash escape / unescape).
 */

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const UNESCAPE_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

const ESCAPE_RE = /[&<>"']/g;
const UNESCAPE_RE = /&(?:amp|lt|gt|quot|#39);/g;

/** Escape `&`, `<`, `>`, `"`, and `'` to HTML entities (lodash.escape parity). */
export function escapeHtml(value: string): string {
  return value.replace(ESCAPE_RE, (char) => ESCAPE_MAP[char] ?? char);
}

/** Unescape `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` (lodash.unescape parity). */
export function unescapeHtml(value: string): string {
  return value.replace(UNESCAPE_RE, (entity) => UNESCAPE_MAP[entity] ?? entity);
}

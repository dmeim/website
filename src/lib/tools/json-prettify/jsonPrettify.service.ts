/**
 * JSON prettify / format.
 * Parity with it-tools json-viewer (`/json-prettify`): JSON5.parse + optional key sort + JSON.stringify.
 */
import JSON5 from "json5";

export const DEFAULT_RAW_JSON = '{"hello": "world", "foo": "bar"}';
export const DEFAULT_INDENT_SIZE = 3;
export const DEFAULT_SORT_KEYS = true;
export const MIN_INDENT_SIZE = 0;
export const MAX_INDENT_SIZE = 10;

export function clampIndentSize(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_INDENT_SIZE;
  return Math.min(MAX_INDENT_SIZE, Math.max(MIN_INDENT_SIZE, Math.trunc(value)));
}

/** Recursively sort object keys alphabetically (arrays keep order; items are walked). */
export function sortObjectKeys<T>(obj: T): T {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys) as unknown as T;
  }

  return Object.keys(obj)
    .sort((a, b) => a.localeCompare(b))
    .reduce(
      (sortedObj, key) => {
        sortedObj[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
        return sortedObj;
      },
      // A plain object would treat a "__proto__" key as its prototype and drop it from the output.
      Object.create(null) as Record<string, unknown>,
    ) as T;
}

/** Blank input is the empty state, so it is valid. */
export function isValidJson(value: string): boolean {
  return getJsonError(value) === null;
}

/** A message with the parser's reason and position, or null when the input is blank or valid. */
export function getJsonError(value: string): string | null {
  if (value.trim() === "") return null;
  try {
    JSON5.parse(value);
    return null;
  } catch (error) {
    const detail = error instanceof Error ? error.message.replace(/^JSON5: /, "") : "";
    return detail ? `Provided JSON is not valid: ${detail}.` : "Provided JSON is not valid.";
  }
}

/**
 * Parse JSON5 and stringify with optional key sorting.
 * Returns "" on parse failure (matches it-tools `withDefaultOnError`).
 */
export function formatJson({
  rawJson,
  sortKeys = DEFAULT_SORT_KEYS,
  indentSize = DEFAULT_INDENT_SIZE,
}: {
  rawJson: string;
  sortKeys?: boolean;
  indentSize?: number;
}): string {
  try {
    const parsed = JSON5.parse(rawJson);
    const indent = clampIndentSize(indentSize);
    return JSON.stringify(sortKeys ? sortObjectKeys(parsed) : parsed, null, indent);
  } catch {
    return "";
  }
}

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
      {} as Record<string, unknown>,
    ) as T;
}

/** Empty input is valid (matches it-tools validation). */
export function isValidJson(value: string): boolean {
  if (value === "") return true;
  try {
    JSON5.parse(value);
    return true;
  } catch {
    return false;
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

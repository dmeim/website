/**
 * JSON minify / compress.
 * Parity with it-tools json-minify: JSON5.parse + JSON.stringify(..., null, 0).
 */
import JSON5 from "json5";

export const DEFAULT_RAW_JSON = '{\n\t"hello": [\n\t\t"world"\n\t]\n}';

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
 * Parse JSON5 and stringify with no indent (minified).
 * Returns "" on parse failure (matches it-tools `withDefaultOnError`).
 */
export function minifyJson(rawJson: string): string {
  try {
    return JSON.stringify(JSON5.parse(rawJson), null, 0);
  } catch {
    return "";
  }
}

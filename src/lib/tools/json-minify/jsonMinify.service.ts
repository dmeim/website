/**
 * JSON minify / compress.
 * Parity with it-tools json-minify: JSON5.parse + JSON.stringify(..., null, 0).
 */
import JSON5 from "json5";

export const DEFAULT_RAW_JSON = '{\n\t"hello": [\n\t\t"world"\n\t]\n}';

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

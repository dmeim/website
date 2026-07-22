/**
 * Convert JSON (JSON5-tolerant) to XML.
 * Parity with it-tools: `JSON5.parse` + `xml-js` js2xml with `{ compact: true }`.
 */
import JSON5 from "json5";
import convert from "xml-js";

/** Returns true when JSON5 parse does not throw (matches it-tools validation). */
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
 * Convert JSON/JSON5 text to compact XML.
 * Returns "" on parse/convert failure (matches it-tools `withDefaultOnError`).
 */
export function jsonToXml(value: string): string {
  try {
    return convert.js2xml(JSON5.parse(value), { compact: true });
  } catch {
    return "";
  }
}

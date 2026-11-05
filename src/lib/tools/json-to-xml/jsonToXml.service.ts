/**
 * Convert JSON (JSON5-tolerant) to XML.
 * Parity with it-tools: `JSON5.parse` + `xml-js` js2xml with `{ compact: true }`.
 */
import JSON5 from "json5";
import convert from "xml-js";

/** The sample it-tools opens with. */
export const DEFAULT_JSON = `{"a":{"_attributes":{"x":"1.234","y":"It's"}}}`;

/** xml-js escapes only the quote in attributes, which leaves `<` and `&` as broken XML. */
function escapeAttributeValue(value: string): string {
  return value.replace(/&(?!quot;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toXml(parsed: unknown): string {
  return convert.js2xml(parsed as object, { compact: true, attributeValueFn: escapeAttributeValue });
}

/** Why this JSON has no XML form, or null when it converts or is blank. */
export function getJsonToXmlError(value: string): string | null {
  if (value.trim() === "") return null;
  let parsed: unknown;
  try {
    parsed = JSON5.parse(value);
  } catch {
    return "Provided JSON is not valid.";
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return 'XML needs an object at the top level, like {"root": {"item": 1}}, so a lone list or value cannot convert.';
  }
  try {
    JSON.stringify(convert.xml2js(toXml(parsed), { compact: true }));
    return null;
  } catch {
    return "A key in this JSON cannot be an XML name. Names cannot hold spaces or start with a digit.";
  }
}

/** Returns true when JSON5 parse does not throw (matches it-tools validation). */
export function isValidJson(value: string): boolean {
  if (value.trim() === "") return true;
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
    return getJsonToXmlError(value) ? "" : toXml(JSON5.parse(value));
  } catch {
    return "";
  }
}

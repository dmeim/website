/**
 * Convert XML to pretty-printed JSON.
 * Parity with it-tools: `xml-js` xml2js with `{ compact: true }`, indent 2.
 */
import convert from "xml-js";

function cleanRawXml(rawXml: string): string {
  return rawXml.trim();
}

/**
 * Validate XML for conversion.
 * Empty / whitespace-only input is valid (matches it-tools xml-formatter rule).
 * Uses xml-js + JSON.stringify so circular/unclosed trees that cannot be
 * serialized are treated as invalid (same outcome as it-tools withDefaultOnError).
 */
export function isValidXml(value: string): boolean {
  const cleaned = cleanRawXml(value);
  if (cleaned === "") return true;

  try {
    JSON.stringify(convert.xml2js(cleaned, { compact: true }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert XML text to JSON with 2-space indent.
 * Returns "" on parse/stringify failure (matches it-tools `withDefaultOnError`).
 */
export function xmlToJson(value: string): string {
  try {
    return JSON.stringify(
      convert.xml2js(value, { compact: true }),
      null,
      2,
    );
  } catch {
    return "";
  }
}

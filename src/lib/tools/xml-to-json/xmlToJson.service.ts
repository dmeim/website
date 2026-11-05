/**
 * Convert XML to pretty-printed JSON.
 * Parity with it-tools: `xml-js` xml2js with `{ compact: true }`, indent 2.
 */
import convert from "xml-js";
import xmlFormat from "xml-formatter";

/** The sample it-tools opens with. */
export const DEFAULT_XML = `<a x="1.234" y="It's"/>`;

function cleanRawXml(rawXml: string): string {
  return rawXml.trim();
}

/**
 * Validate XML for conversion.
 * Empty / whitespace-only input is valid (matches it-tools xml-formatter rule).
 * xml-formatter is the it-tools check and rejects a second root, but it closes open tags on its
 * own, so xml-js + JSON.stringify must also pass: those unclosed trees come back circular.
 */
export function isValidXml(value: string): boolean {
  const cleaned = cleanRawXml(value);
  if (cleaned === "") return true;

  try {
    xmlFormat(cleaned);
    JSON.stringify(convert.xml2js(cleaned, { compact: true }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert XML text to JSON with 2-space indent.
 * Returns "" on blank input or parse/stringify failure (matches it-tools `withDefaultOnError`).
 */
export function xmlToJson(value: string): string {
  const cleaned = cleanRawXml(value);
  if (cleaned === "") return "";
  try {
    return JSON.stringify(
      convert.xml2js(cleaned, { compact: true }),
      null,
      2,
    );
  } catch {
    return "";
  }
}

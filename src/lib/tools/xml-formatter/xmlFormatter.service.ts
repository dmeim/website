/**
 * XML formatter / prettify.
 * Parity with it-tools xml-formatter: xml-formatter npm + trim + collapseContent / indent.
 */
import xmlFormat from "xml-formatter";

export const DEFAULT_RAW_XML =
  "<hello><world>foo</world><world>bar</world></hello>";
export const DEFAULT_INDENT_SIZE = 2;
export const DEFAULT_COLLAPSE_CONTENT = true;
export const MIN_INDENT_SIZE = 0;
export const MAX_INDENT_SIZE = 10;

export function clampIndentSize(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_INDENT_SIZE;
  return Math.min(MAX_INDENT_SIZE, Math.max(MIN_INDENT_SIZE, Math.trunc(value)));
}

function cleanRawXml(rawXml: string): string {
  return rawXml.trim();
}

/** Empty input is valid (matches it-tools validation). */
export function isValidXml(rawXml: string): boolean {
  const cleaned = cleanRawXml(rawXml);
  if (cleaned === "") return true;

  try {
    xmlFormat(cleaned);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format XML with configurable indent and content collapse.
 * Returns "" on failure (matches it-tools `withDefaultOnError`).
 */
export function formatXml({
  rawXml,
  indentSize = DEFAULT_INDENT_SIZE,
  collapseContent = DEFAULT_COLLAPSE_CONTENT,
}: {
  rawXml: string;
  indentSize?: number;
  collapseContent?: boolean;
}): string {
  try {
    const cleaned = cleanRawXml(rawXml);
    if (cleaned === "") return "";

    const indent = clampIndentSize(indentSize);
    return (
      xmlFormat(cleaned, {
        indentation: " ".repeat(indent),
        collapseContent,
        lineSeparator: "\n",
      }) ?? ""
    );
  } catch {
    return "";
  }
}

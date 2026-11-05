/**
 * YAML prettify / format.
 * Parity with it-tools yaml-viewer (`/yaml-prettify`): yaml.parse + yaml.stringify with sortMapEntries / indent.
 */
import { parseAllDocuments, stringify as stringifyYaml, type Document } from "yaml";

export const DEFAULT_RAW_YAML = "";
export const DEFAULT_INDENT_SIZE = 2;
export const DEFAULT_SORT_KEYS = false;
export const MIN_INDENT_SIZE = 1;
export const MAX_INDENT_SIZE = 10;

export function clampIndentSize(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_INDENT_SIZE;
  return Math.min(MAX_INDENT_SIZE, Math.max(MIN_INDENT_SIZE, Math.trunc(value)));
}

/** All documents in the stream, throwing the first syntax error. Blank or comment-only input has none. */
function parseDocuments(value: string): Document[] {
  const documents = parseAllDocuments(value);
  if (!Array.isArray(documents)) return [];

  const firstError = documents.flatMap((document) => document.errors)[0];
  if (firstError) throw firstError;
  return documents;
}

/** Blank input is the empty state, so it is valid. */
export function isValidYaml(value: string): boolean {
  return getYamlError(value) === null;
}

/** A message with the parser's reason and position, or null when the input is blank or valid. */
export function getYamlError(value: string): string | null {
  try {
    parseDocuments(value);
    return null;
  } catch (error) {
    const detail = error instanceof Error ? error.message.split("\n")[0]?.replace(/:$/, "") : "";
    return detail ? `Provided YAML is not valid: ${detail}.` : "Provided YAML is not valid.";
  }
}

/**
 * Parse YAML and stringify with optional key sorting and indent. Multiple documents stay separated by `---`.
 * Returns "" for blank input and on parse/stringify failure (matches it-tools `withDefaultOnError`).
 */
export function formatYaml({
  rawYaml,
  sortKeys = DEFAULT_SORT_KEYS,
  indentSize = DEFAULT_INDENT_SIZE,
}: {
  rawYaml: string;
  sortKeys?: boolean;
  indentSize?: number;
}): string {
  try {
    const indent = clampIndentSize(indentSize);
    return parseDocuments(rawYaml)
      .map((document) => stringifyYaml(document.toJS(), { sortMapEntries: sortKeys, indent }))
      .join("---\n");
  } catch {
    return "";
  }
}

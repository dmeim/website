/**
 * YAML prettify / format.
 * Parity with it-tools yaml-viewer (`/yaml-prettify`): yaml.parse + yaml.stringify with sortMapEntries / indent.
 */
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

export const DEFAULT_RAW_YAML = "";
export const DEFAULT_INDENT_SIZE = 2;
export const DEFAULT_SORT_KEYS = false;
export const MIN_INDENT_SIZE = 1;
export const MAX_INDENT_SIZE = 10;

export function clampIndentSize(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_INDENT_SIZE;
  return Math.min(MAX_INDENT_SIZE, Math.max(MIN_INDENT_SIZE, Math.trunc(value)));
}

/** Empty input is valid (matches it-tools validation). */
export function isValidYaml(value: string): boolean {
  if (value === "") return true;
  try {
    parseYaml(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse YAML and stringify with optional key sorting and indent.
 * Returns "" on parse/stringify failure (matches it-tools `withDefaultOnError`).
 * Empty input parses as null and stringifies to `"null\n"` (yaml package / it-tools parity).
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
    const parsed = parseYaml(rawYaml);
    const indent = clampIndentSize(indentSize);
    return stringifyYaml(parsed, {
      sortMapEntries: sortKeys,
      indent,
    });
  } catch {
    return "";
  }
}

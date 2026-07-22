/**
 * Convert JSON (JSON5-tolerant) to YAML.
 * Parity with it-tools: `JSON5.parse` + `yaml.stringify`.
 */
import JSON5 from "json5";
import { stringify as stringifyYaml } from "yaml";

/** Returns true when parse + stringify does not throw (matches it-tools validation). */
export function isValidJson(value: string): boolean {
  if (value === "") return true;
  try {
    stringifyYaml(JSON5.parse(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert JSON/JSON5 text to YAML.
 * Returns "" on parse/stringify failure (matches it-tools `withDefaultOnError`).
 */
export function jsonToYaml(value: string): string {
  try {
    return stringifyYaml(JSON5.parse(value));
  } catch {
    return "";
  }
}

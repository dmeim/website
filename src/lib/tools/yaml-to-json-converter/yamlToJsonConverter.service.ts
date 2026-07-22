/**
 * Convert YAML to pretty-printed JSON.
 * Parity with it-tools: `yaml` parse with `{ merge: true }`, indent 3.
 */
import { parse as parseYaml } from "yaml";

/** Parse YAML; returns true when parsing does not throw (matches it-tools validation). */
export function isValidYaml(value: string): boolean {
  try {
    parseYaml(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert YAML text to JSON with 3-space indent.
 * Returns "" on parse/stringify failure or when the parsed value is falsy
 * (matches it-tools `obj ? JSON.stringify(...) : ''`).
 */
export function yamlToJson(value: string): string {
  try {
    const obj = parseYaml(value, { merge: true });
    return obj ? JSON.stringify(obj, null, 3) : "";
  } catch {
    return "";
  }
}

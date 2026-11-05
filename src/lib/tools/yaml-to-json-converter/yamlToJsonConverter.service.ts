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

/** Why this YAML has no JSON form, or null when it converts or is blank. */
export function getYamlToJsonError(value: string): string | null {
  if (value.trim() === "") return null;
  let parsed: unknown;
  try {
    parsed = parseYaml(value, { merge: true });
  } catch {
    return "Provided YAML is not valid.";
  }
  try {
    JSON.stringify(parsed);
    return null;
  } catch {
    return "This YAML refers to itself through an alias, and JSON has no way to write that.";
  }
}

/**
 * Convert YAML text to JSON with 3-space indent.
 * Returns "" on parse/stringify failure or for an empty document. Unlike it-tools,
 * `0` and `false` still convert, since blank output would look like a failure.
 */
export function yamlToJson(value: string): string {
  try {
    const obj = parseYaml(value, { merge: true });
    return obj === null || obj === undefined ? "" : JSON.stringify(obj, null, 3);
  } catch {
    return "";
  }
}

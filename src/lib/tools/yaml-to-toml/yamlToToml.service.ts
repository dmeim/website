/**
 * Convert YAML to TOML.
 * Parity with it-tools: `yaml` parse + `iarna-toml-esm` stringify.
 */
import { stringify as stringifyToml } from "iarna-toml-esm";
import { parse as parseYaml } from "yaml";

/** Returns true when YAML parse does not throw (matches it-tools validation). */
export function isValidYaml(value: string): boolean {
  if (value === "") return true;
  try {
    parseYaml(value);
    return true;
  } catch {
    return false;
  }
}

function isTable(value: unknown): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Why this YAML has no TOML form, or null when it converts or holds nothing. */
export function getYamlToTomlError(value: string): string | null {
  if (value.trim() === "") return null;
  let parsed: unknown;
  try {
    parsed = parseYaml(value, { merge: true });
  } catch {
    return "Provided YAML is not valid.";
  }
  if (parsed === null) return null;
  if (!isTable(parsed)) {
    return "TOML needs key: value pairs at the top level, so a lone list or value cannot convert.";
  }
  try {
    stringifyToml(parsed as Parameters<typeof stringifyToml>[0]);
    return null;
  } catch {
    return "This YAML holds a value TOML cannot represent, such as an alias that refers to itself.";
  }
}

/**
 * Convert YAML text to TOML.
 * Returns "" on empty/whitespace input or parse/stringify failure
 * (matches it-tools `withDefaultOnError` + trim empty short-circuit).
 */
export function yamlToToml(value: string): string {
  if (value.trim() === "") return "";
  try {
    return [stringifyToml(parseYaml(value, { merge: true }))].flat().join("\n").trim();
  } catch {
    return "";
  }
}

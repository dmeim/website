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

/**
 * Convert YAML text to TOML.
 * Returns "" on empty/whitespace input or parse/stringify failure
 * (matches it-tools `withDefaultOnError` + trim empty short-circuit).
 */
export function yamlToToml(value: string): string {
  if (value.trim() === "") return "";
  try {
    return [stringifyToml(parseYaml(value))].flat().join("\n").trim();
  } catch {
    return "";
  }
}

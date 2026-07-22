/**
 * Convert TOML to YAML.
 * Parity with it-tools: `iarna-toml-esm` parse + `yaml` stringify.
 */
import { parse as parseToml } from "iarna-toml-esm";
import { stringify as stringifyYaml } from "yaml";

/** Parse TOML; returns true when parsing does not throw (matches it-tools validation). */
export function isValidToml(value: string): boolean {
  try {
    parseToml(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert TOML text to YAML.
 * Returns "" on empty/whitespace input or parse/stringify failure
 * (matches it-tools `withDefaultOnError` + trim empty short-circuit).
 */
export function tomlToYaml(value: string): string {
  if (value.trim() === "") return "";
  try {
    return stringifyYaml(parseToml(value));
  } catch {
    return "";
  }
}

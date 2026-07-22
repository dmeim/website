/**
 * Convert TOML to pretty-printed JSON.
 * Parity with it-tools: `iarna-toml-esm` parse, indent 3.
 */
import { parse as parseToml } from "iarna-toml-esm";

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
 * Convert TOML text to JSON with 3-space indent.
 * Returns "" on empty input or parse/stringify failure
 * (matches it-tools `withDefaultOnError` + empty short-circuit).
 */
export function tomlToJson(value: string): string {
  if (value === "") return "";
  try {
    return JSON.stringify(parseToml(value), null, 3);
  } catch {
    return "";
  }
}

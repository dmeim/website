/**
 * Convert JSON (JSON5-tolerant) to TOML.
 * Parity with it-tools: `JSON5.parse` + `iarna-toml-esm` stringify.
 */
import { stringify as stringifyToml } from "iarna-toml-esm";
import JSON5 from "json5";

/** Returns true when JSON5 parse does not throw (matches it-tools validation). */
export function isValidJson(value: string): boolean {
  if (value === "") return true;
  try {
    JSON5.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert JSON/JSON5 text to TOML.
 * Returns "" on empty/whitespace input or parse/stringify failure
 * (matches it-tools `withDefaultOnError` + trim empty short-circuit).
 */
export function jsonToToml(value: string): string {
  if (value.trim() === "") return "";
  try {
    return [stringifyToml(JSON5.parse(value))].flat().join("\n").trim();
  } catch {
    return "";
  }
}

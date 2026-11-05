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

// From the private use area, so it cannot clash with a real TOML string in practice.
const BIG_INT_MARKER = "\uE000bigint:";
const BIG_INT_TOKEN = new RegExp(`"${BIG_INT_MARKER}(-?\\d+)"`, "g");

/** The TOML parser returns BigInt above 2^53, which JSON.stringify refuses, so write those digits by hand. */
function stringifyWithBigInts(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, item: unknown) => (typeof item === "bigint" ? `${BIG_INT_MARKER}${item}` : item),
    3,
  ).replace(BIG_INT_TOKEN, "$1");
}

/**
 * Convert TOML text to JSON with 3-space indent.
 * Returns "" on blank input or parse/stringify failure
 * (matches it-tools `withDefaultOnError` + empty short-circuit).
 */
export function tomlToJson(value: string): string {
  if (value.trim() === "") return "";
  try {
    return stringifyWithBigInts(parseToml(value));
  } catch {
    return "";
  }
}

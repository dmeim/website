/**
 * MAC address generator — random MACs with optional prefix, case, and separator.
 * Parity with it-tools mac-address-generator (no lodash).
 */

export const MAC_QUANTITY_MIN = 1;
export const MAC_QUANTITY_MAX = 100;
export const MAC_QUANTITY_DEFAULT = 1;

export const DEFAULT_MAC_PREFIX = "64:16:7F";

export const MAC_SEPARATORS = [":", "-", ".", ""] as const;
export type MacSeparator = (typeof MAC_SEPARATORS)[number];
export const DEFAULT_MAC_SEPARATOR: MacSeparator = ":";

export const MAC_CASES = ["upper", "lower"] as const;
export type MacCase = (typeof MAC_CASES)[number];
export const DEFAULT_MAC_CASE: MacCase = "upper";

/** Partial MAC prefix — up to 6 hex octets with optional : - . or space separators. */
const PARTIAL_MAC_PATTERN =
  /^([0-9a-f]{2}[:\-. ]){0,5}([0-9a-f]{0,2})$/i;

export function clampMacQuantity(
  value: unknown,
  fallback = MAC_QUANTITY_DEFAULT,
): number {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(
    MAC_QUANTITY_MAX,
    Math.max(MAC_QUANTITY_MIN, Math.trunc(parsed)),
  );
}

export function normalizeMacSeparator(
  value: unknown,
  fallback: MacSeparator = DEFAULT_MAC_SEPARATOR,
): MacSeparator {
  if (typeof value === "string" && (MAC_SEPARATORS as readonly string[]).includes(value)) {
    return value as MacSeparator;
  }
  return fallback;
}

export function normalizeMacCase(
  value: unknown,
  fallback: MacCase = DEFAULT_MAC_CASE,
): MacCase {
  if (typeof value === "string" && (MAC_CASES as readonly string[]).includes(value)) {
    return value as MacCase;
  }
  return fallback;
}

/** True when the prefix is empty or a valid partial MAC address. */
export function isValidPartialMacAddress(value: string): boolean {
  return PARTIAL_MAC_PATTERN.test(value.trim());
}

/**
 * Split a MAC prefix into hex octets.
 * Continuous hex is grouped by 2; otherwise splits on non-hex characters.
 */
export function splitPrefix(prefix: string): string[] {
  const base =
    prefix.match(/[^0-9a-f]/i) === null
      ? (prefix.match(/.{1,2}/g) ?? [])
      : prefix.split(/[^0-9a-f]/i);

  return base.filter(Boolean).map((byte) => byte.padStart(2, "0"));
}

function defaultRandomByte(): string {
  const bytes = new Uint8Array(1);
  crypto.getRandomValues(bytes);
  return bytes[0]!.toString(16).padStart(2, "0");
}

/** Generate one MAC address. Inject `getRandomByte` for deterministic tests. */
export function generateRandomMacAddress({
  prefix: rawPrefix = "",
  separator = ":",
  getRandomByte = defaultRandomByte,
}: {
  prefix?: string;
  separator?: string;
  getRandomByte?: () => string;
} = {}): string {
  const prefix = splitPrefix(rawPrefix);
  const randomCount = Math.max(0, 6 - prefix.length);
  const randomBytes = Array.from({ length: randomCount }, () => getRandomByte());
  const bytes = [...prefix, ...randomBytes];
  return bytes.join(separator);
}

export type GenerateMacAddressesOptions = {
  quantity?: number;
  prefix?: string;
  separator?: MacSeparator | string;
  caseStyle?: MacCase;
  getRandomByte?: () => string;
};

/**
 * Generate one or more MAC addresses (newline-joined), matching it-tools output.
 * Returns "" when the prefix is invalid.
 */
export function generateMacAddresses({
  quantity = MAC_QUANTITY_DEFAULT,
  prefix = "",
  separator = DEFAULT_MAC_SEPARATOR,
  caseStyle = DEFAULT_MAC_CASE,
  getRandomByte,
}: GenerateMacAddressesOptions = {}): string {
  if (!isValidPartialMacAddress(prefix)) {
    return "";
  }

  const count = clampMacQuantity(quantity);
  const sep = normalizeMacSeparator(separator);
  const casing = normalizeMacCase(caseStyle);
  const transform =
    casing === "upper"
      ? (value: string) => value.toUpperCase()
      : (value: string) => value.toLowerCase();

  const ids = Array.from({ length: count }, () =>
    transform(
      generateRandomMacAddress({
        prefix,
        separator: sep,
        getRandomByte,
      }),
    ),
  );

  return ids.join("\n");
}

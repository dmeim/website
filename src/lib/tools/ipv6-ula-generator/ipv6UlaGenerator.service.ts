/**
 * IPv6 ULA generator — RFC 4193-style unique local addresses from timestamp + MAC.
 * Parity with it-tools ipv6-ula-generator (Web Crypto SHA-1 instead of crypto-js).
 */

export const DEFAULT_MAC_ADDRESS = "20:37:06:12:34:56";

/** Full MAC: 3–6 octets separated by `:` or `-` (same rule as it-tools). */
const MAC_ADDRESS_PATTERN = /^([0-9A-Fa-f]{2}[:-]){2,5}([0-9A-Fa-f]{2})$/;

export type Ipv6UlaSectionKey = "ula" | "firstRoutable" | "lastRoutable";

export type Ipv6UlaSection = {
  key: Ipv6UlaSectionKey;
  label: string;
  value: string;
};

export type Ipv6UlaResult = {
  /** Global ID prefix without trailing `::/48`, e.g. `fd12:3456:789a`. */
  prefix: string;
  ula: string;
  firstRoutable: string;
  lastRoutable: string;
  sections: Ipv6UlaSection[];
};

export type Sha1HexFn = (message: string) => Promise<string> | string;

/** True when `value` is a valid MAC address (trimmed), matching it-tools. */
export function isValidMacAddress(value: string): boolean {
  return MAC_ADDRESS_PATTERN.test(value.trim());
}

/** SHA-1 hex digest via Web Crypto (40 lowercase hex chars). */
export async function sha1Hex(message: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(message),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Build ULA strings from the lower 40 bits of a SHA-1 digest (10 hex chars).
 * Matches it-tools: `fd` + hex40 → `fdxx:xxxx:xxxx`.
 */
export function buildUlaFromHex40(hex40bit: string): Ipv6UlaResult {
  const prefix = `fd${hex40bit.substring(0, 2)}:${hex40bit.substring(2, 6)}:${hex40bit.substring(6)}`;
  const ula = `${prefix}::/48`;
  const firstRoutable = `${prefix}:0::/64`;
  const lastRoutable = `${prefix}:ffff::/64`;

  return {
    prefix,
    ula,
    firstRoutable,
    lastRoutable,
    sections: [
      { key: "ula", label: "IPv6 ULA", value: ula },
      { key: "firstRoutable", label: "First routable block", value: firstRoutable },
      { key: "lastRoutable", label: "Last routable block", value: lastRoutable },
    ],
  };
}

export type GenerateIpv6UlaOptions = {
  macAddress: string;
  /** Milliseconds since epoch; defaults to `Date.now()`. */
  timestamp?: number;
  /** Injectible digest for tests; defaults to Web Crypto SHA-1. */
  sha1?: Sha1HexFn;
};

/**
 * Generate an IPv6 ULA from current (or injected) timestamp + MAC address.
 * Returns `null` when the MAC is invalid.
 */
export async function generateIpv6Ula({
  macAddress,
  timestamp = Date.now(),
  sha1 = sha1Hex,
}: GenerateIpv6UlaOptions): Promise<Ipv6UlaResult | null> {
  if (!isValidMacAddress(macAddress)) {
    return null;
  }

  const digest = await sha1(String(timestamp) + macAddress);
  const hex40bit = digest.substring(30);

  return buildUlaFromHex40(hex40bit);
}

/** Empty labeled rows for invalid input (UI placeholders). */
export function emptyUlaSections(): Ipv6UlaSection[] {
  return [
    { key: "ula", label: "IPv6 ULA", value: "" },
    { key: "firstRoutable", label: "First routable block", value: "" },
    { key: "lastRoutable", label: "Last routable block", value: "" },
  ];
}

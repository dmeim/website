/**
 * IPv4 address converter — decimal, hex, binary, and IPv4-mapped IPv6 forms.
 * Parity with it-tools ipv4-address-converter (no lodash).
 */

import { convertBase } from "@/lib/tools/base-converter";

export const DEFAULT_IP = "192.168.1.1";

export const IPV6_MAPPED_PREFIX = "0000:0000:0000:0000:0000:ffff:";
export const IPV6_MAPPED_PREFIX_SHORT = "::ffff:";

export type ConversionSectionKey =
  | "decimal"
  | "hexadecimal"
  | "binary"
  | "ipv6"
  | "ipv6Short";

export type ConversionSection = {
  key: ConversionSectionKey;
  label: string;
  value: string;
};

/** Convert a dotted IPv4 address to its 32-bit unsigned integer. Invalid → 0. */
export function ipv4ToInt({ ip }: { ip: string }): number {
  if (!isValidIpv4({ ip })) {
    return 0;
  }

  return ip
    .trim()
    .split(".")
    .reduce((acc, part, index) => acc + Number(part) * 256 ** (3 - index), 0);
}

/**
 * Map IPv4 into an IPv4-mapped IPv6 string.
 * Default prefix is the full `0000:…:ffff:` form; pass `::ffff:` for the short form.
 */
export function ipv4ToIpv6({
  ip,
  prefix = IPV6_MAPPED_PREFIX,
}: {
  ip: string;
  prefix?: string;
}): string {
  if (!isValidIpv4({ ip })) {
    return "";
  }

  const hexOctets = ip
    .trim()
    .split(".")
    .map((part) => Number.parseInt(part, 10).toString(16).padStart(2, "0"));

  const hextets: string[] = [];
  for (let i = 0; i < hexOctets.length; i += 2) {
    hextets.push(`${hexOctets[i]}${hexOctets[i + 1]}`);
  }

  return prefix + hextets.join(":");
}

/** True when `ip` is a valid dotted-quad IPv4 address (trimmed). */
export function isValidIpv4({ ip }: { ip: string }): boolean {
  const cleanIp = ip.trim();

  return /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/.test(cleanIp);
}

/**
 * Labeled conversion rows matching it-tools order.
 * Invalid input yields empty values (UI shows a placeholder).
 */
export function getConversionSections(ip: string): ConversionSection[] {
  if (!isValidIpv4({ ip })) {
    return [
      { key: "decimal", label: "Decimal", value: "" },
      { key: "hexadecimal", label: "Hexadecimal", value: "" },
      { key: "binary", label: "Binary", value: "" },
      { key: "ipv6", label: "IPv6", value: "" },
      { key: "ipv6Short", label: "IPv6 (short)", value: "" },
    ];
  }

  const ipInDecimal = ipv4ToInt({ ip });
  const decimal = String(ipInDecimal);

  return [
    { key: "decimal", label: "Decimal", value: decimal },
    {
      key: "hexadecimal",
      label: "Hexadecimal",
      value: convertBase({
        fromBase: 10,
        toBase: 16,
        value: decimal,
      }).toUpperCase(),
    },
    {
      key: "binary",
      label: "Binary",
      value: convertBase({ fromBase: 10, toBase: 2, value: decimal }),
    },
    {
      key: "ipv6",
      label: "IPv6",
      value: ipv4ToIpv6({ ip }),
    },
    {
      key: "ipv6Short",
      label: "IPv6 (short)",
      value: ipv4ToIpv6({ ip, prefix: IPV6_MAPPED_PREFIX_SHORT }),
    },
  ];
}

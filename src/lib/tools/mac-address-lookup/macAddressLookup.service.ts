/**
 * MAC address lookup — IEEE OUI vendor/manufacturer from a MAC address.
 * Parity with it-tools mac-address-lookup (`oui-data`).
 */

import ouiData from "oui-data";

export const DEFAULT_MAC_ADDRESS = "20:37:06:12:34:56";

export const UNKNOWN_VENDOR_MESSAGE = "Unknown vendor for this address";

/** Full MAC: 3–6 octets separated by `:` or `-` (same rule as it-tools). */
const MAC_ADDRESS_PATTERN = /^([0-9A-Fa-f]{2}[:-]){2,5}([0-9A-Fa-f]{2})$/;

const defaultDb = ouiData as Record<string, string>;

export type OuiVendorDb = Record<string, string>;

/** True when `value` is a valid MAC address (trimmed), matching it-tools. */
export function isValidMacAddress(value: string): boolean {
  return MAC_ADDRESS_PATTERN.test(value.trim());
}

/**
 * OUI key: strip separators/spaces, uppercase, first 6 hex characters.
 * Matches it-tools `getVendorValue`.
 */
export function getOuiKey(address: string): string {
  return address
    .trim()
    .replace(/[-.: ]/g, "")
    .toUpperCase()
    .substring(0, 6);
}

/**
 * Look up vendor info for a MAC address.
 * Returns the multiline vendor string, or `undefined` when unknown.
 */
export function lookupMacVendor(
  address: string,
  db: OuiVendorDb = defaultDb,
): string | undefined {
  const key = getOuiKey(address);
  if (!key) {
    return undefined;
  }
  return db[key];
}

/** Split vendor info into display lines (it-tools renders each `\n` separately). */
export function getVendorLines(vendor: string | undefined): string[] {
  if (!vendor) {
    return [];
  }
  return vendor.split("\n");
}

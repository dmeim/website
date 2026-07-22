/**
 * IPv4 range expander — expand a start/end address pair into the covering CIDR.
 * Parity with it-tools ipv4-range-expander.
 */

import { convertBase } from "@/lib/tools/base-converter";
import { ipv4ToInt, isValidIpv4 } from "@/lib/tools/ipv4-address-converter";

export const DEFAULT_START_IP = "192.168.1.1";
export const DEFAULT_END_IP = "192.168.6.255";

export type Ipv4RangeExpanderResult = {
  oldSize?: number;
  newStart?: string;
  newEnd?: string;
  newCidr?: string;
  newSize?: number;
};

export type ResultRow = {
  key: string;
  label: string;
  oldValue: string;
  newValue: string;
};

function bits2ip(ipInt: number): string {
  return `${ipInt >>> 24}.${(ipInt >> 16) & 255}.${(ipInt >> 8) & 255}.${ipInt & 255}`;
}

function getRangesize(start: string, end: string): number {
  if (start == null || end == null) {
    return -1;
  }

  return 1 + Number.parseInt(end, 2) - Number.parseInt(start, 2);
}

function getCidr(
  start: string,
  end: string,
): { start: string; end: string; mask: number } | null {
  if (start == null || end == null) {
    return null;
  }

  const range = getRangesize(start, end);
  if (range < 1) {
    return null;
  }

  let mask = 32;
  for (let i = 0; i < 32; i++) {
    if (start[i] !== end[i]) {
      mask = i;
      break;
    }
  }

  const newStart = start.substring(0, mask) + "0".repeat(32 - mask);
  const newEnd = end.substring(0, mask) + "1".repeat(32 - mask);

  return { start: newStart, end: newEnd, mask };
}

/** Compute the CIDR that covers startIp…endIp. Undefined when end < start. */
export function calculateCidr({
  startIp,
  endIp,
}: {
  startIp: string;
  endIp: string;
}): Ipv4RangeExpanderResult | undefined {
  const start = convertBase({
    value: ipv4ToInt({ ip: startIp }).toString(),
    fromBase: 10,
    toBase: 2,
  }).padStart(32, "0");
  const end = convertBase({
    value: ipv4ToInt({ ip: endIp }).toString(),
    fromBase: 10,
    toBase: 2,
  }).padStart(32, "0");

  const cidr = getCidr(start, end);
  if (cidr != null) {
    const result: Ipv4RangeExpanderResult = {};
    result.newEnd = bits2ip(Number.parseInt(cidr.end, 2));
    result.newStart = bits2ip(Number.parseInt(cidr.start, 2));
    result.newCidr = `${result.newStart}/${cidr.mask}`;
    result.newSize = getRangesize(cidr.start, cidr.end);
    result.oldSize = getRangesize(start, end);
    return result;
  }

  return undefined;
}

/** True when both addresses are valid dotted-quad IPv4. */
export function areInputsValid(startIp: string, endIp: string): boolean {
  return isValidIpv4({ ip: startIp }) && isValidIpv4({ ip: endIp });
}

/**
 * Labeled old/new rows matching it-tools order.
 * Empty when inputs are invalid or the range cannot be expanded.
 */
export function getResultRows(
  startIp: string,
  endIp: string,
  result: Ipv4RangeExpanderResult | undefined,
): ResultRow[] {
  if (!areInputsValid(startIp, endIp) || result === undefined) {
    return [];
  }

  return [
    {
      key: "start-address",
      label: "Start address",
      oldValue: startIp,
      newValue: result.newStart ?? "",
    },
    {
      key: "end-address",
      label: "End address",
      oldValue: endIp,
      newValue: result.newEnd ?? "",
    },
    {
      key: "addresses-in-range",
      label: "Addresses in range",
      oldValue: result.oldSize?.toLocaleString() ?? "",
      newValue: result.newSize?.toLocaleString() ?? "",
    },
    {
      key: "cidr",
      label: "CIDR",
      oldValue: "",
      newValue: result.newCidr ?? "",
    },
  ];
}

export { isValidIpv4 };

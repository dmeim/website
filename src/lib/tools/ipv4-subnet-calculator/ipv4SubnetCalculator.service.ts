/**
 * IPv4 subnet calculator — parse CIDR / netmask blocks via `netmask`.
 * Parity with it-tools ipv4-subnet-calculator.
 */

import { Netmask } from "netmask";

export const DEFAULT_IP = "192.168.0.1/24";

export type IpClass = "A" | "B" | "C" | "D" | "E";

export type SubnetInfo = {
  /** Netmask block string, e.g. `192.168.0.0/24`. */
  netmask: string;
  networkAddress: string;
  networkMask: string;
  networkMaskBinary: string;
  cidr: string;
  wildcardMask: string;
  networkSize: string;
  firstAddress: string;
  lastAddress: string;
  broadcastAddress: string | undefined;
  ipClass: IpClass | undefined;
};

export type SubnetSectionKey =
  | "netmask"
  | "networkAddress"
  | "networkMask"
  | "networkMaskBinary"
  | "cidr"
  | "wildcardMask"
  | "networkSize"
  | "firstAddress"
  | "lastAddress"
  | "broadcastAddress"
  | "ipClass";

export type SubnetSection = {
  key: SubnetSectionKey;
  label: string;
  value: string | undefined;
  undefinedFallback?: string;
};

/** Classic A–E class from the first octet of an IPv4 address. */
export function getIPClass({ ip }: { ip: string }): IpClass | undefined {
  const [firstOctet] = ip.split(".").map(Number);

  if (Number.isNaN(firstOctet)) {
    return undefined;
  }

  if (firstOctet < 128) {
    return "A";
  }
  if (firstOctet > 127 && firstOctet < 192) {
    return "B";
  }
  if (firstOctet > 191 && firstOctet < 224) {
    return "C";
  }
  if (firstOctet > 223 && firstOctet < 240) {
    return "D";
  }
  if (firstOctet > 239 && firstOctet < 256) {
    return "E";
  }

  return undefined;
}

function bitmaskToBinary(bitmask: number): string {
  return ("1".repeat(bitmask) + "0".repeat(32 - bitmask)).match(/.{8}/g)?.join(".") ?? "";
}

/** Parse an IPv4 address with optional mask; throws on invalid input. */
export function getNetworkInfo(address: string): Netmask {
  return new Netmask(address.trim());
}

/** True when `getNetworkInfo` succeeds. */
export function isValidIpv4Cidr(value: string): boolean {
  try {
    getNetworkInfo(value);
    return true;
  } catch {
    return false;
  }
}

/** Structured subnet fields for a valid address, or undefined when invalid. */
export function parseSubnet(address: string): SubnetInfo | undefined {
  try {
    const block = getNetworkInfo(address);
    return {
      netmask: block.toString(),
      networkAddress: block.base,
      networkMask: block.mask,
      networkMaskBinary: bitmaskToBinary(block.bitmask),
      cidr: `/${block.bitmask}`,
      wildcardMask: block.hostmask,
      networkSize: String(block.size),
      firstAddress: block.first,
      lastAddress: block.last,
      broadcastAddress: block.broadcast,
      ipClass: getIPClass({ ip: block.base }),
    };
  } catch {
    return undefined;
  }
}

/** Labeled rows matching it-tools table order. */
export function getSubnetSections(info: SubnetInfo): SubnetSection[] {
  return [
    { key: "netmask", label: "Netmask", value: info.netmask },
    { key: "networkAddress", label: "Network address", value: info.networkAddress },
    { key: "networkMask", label: "Network mask", value: info.networkMask },
    {
      key: "networkMaskBinary",
      label: "Network mask in binary",
      value: info.networkMaskBinary,
    },
    { key: "cidr", label: "CIDR notation", value: info.cidr },
    { key: "wildcardMask", label: "Wildcard mask", value: info.wildcardMask },
    { key: "networkSize", label: "Network size", value: info.networkSize },
    { key: "firstAddress", label: "First address", value: info.firstAddress },
    { key: "lastAddress", label: "Last address", value: info.lastAddress },
    {
      key: "broadcastAddress",
      label: "Broadcast address",
      value: info.broadcastAddress,
      undefinedFallback: "No broadcast address with this mask",
    },
    {
      key: "ipClass",
      label: "IP class",
      value: info.ipClass,
      undefinedFallback: "Unknown class type",
    },
  ];
}

/**
 * Adjacent same-size block as a CIDR string.
 * Returns undefined when out of address space or current address is invalid.
 */
export function switchBlock(address: string, count = 1): string | undefined {
  try {
    const next = getNetworkInfo(address).next(count);
    return next?.toString();
  } catch {
    return undefined;
  }
}

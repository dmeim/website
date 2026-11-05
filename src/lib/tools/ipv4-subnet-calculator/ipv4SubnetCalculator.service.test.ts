import { describe, expect, it } from "vitest";

import {
  DEFAULT_IP,
  getIPClass,
  getNetworkInfo,
  getSubnetSections,
  isValidIpv4Cidr,
  parseSubnet,
  switchBlock,
} from "./ipv4SubnetCalculator.service";

describe("ipv4-subnet-calculator", () => {
  describe("getIPClass", () => {
    it("classifies A–E from the first octet", () => {
      expect(getIPClass({ ip: "10.0.0.0" })).toBe("A");
      expect(getIPClass({ ip: "127.0.0.1" })).toBe("A");
      expect(getIPClass({ ip: "128.0.0.0" })).toBe("B");
      expect(getIPClass({ ip: "172.16.0.0" })).toBe("B");
      expect(getIPClass({ ip: "191.255.255.255" })).toBe("B");
      expect(getIPClass({ ip: "192.0.0.0" })).toBe("C");
      expect(getIPClass({ ip: "192.168.0.0" })).toBe("C");
      expect(getIPClass({ ip: "223.255.255.255" })).toBe("C");
      expect(getIPClass({ ip: "224.0.0.0" })).toBe("D");
      expect(getIPClass({ ip: "239.255.255.255" })).toBe("D");
      expect(getIPClass({ ip: "240.0.0.0" })).toBe("E");
      expect(getIPClass({ ip: "255.255.255.255" })).toBe("E");
    });

    it("returns undefined for octets outside 0–255 class ranges", () => {
      expect(getIPClass({ ip: "256.0.0.0" })).toBeUndefined();
    });
  });

  describe("isValidIpv4Cidr", () => {
    it("accepts addresses with and without masks", () => {
      expect(isValidIpv4Cidr(DEFAULT_IP)).toBe(true);
      expect(isValidIpv4Cidr("10.0.0.1")).toBe(true);
      expect(isValidIpv4Cidr("10.0.0.0/8")).toBe(true);
      expect(isValidIpv4Cidr(" 192.168.1.10/28 ")).toBe(true);
    });

    it("rejects empty and malformed values", () => {
      expect(isValidIpv4Cidr("")).toBe(false);
      expect(isValidIpv4Cidr("not an ip")).toBe(false);
      expect(isValidIpv4Cidr("999.999.999.999")).toBe(false);
      expect(isValidIpv4Cidr("192.168.0.1/99")).toBe(false);
      expect(isValidIpv4Cidr("192.168.0.1/33")).toBe(false);
      expect(isValidIpv4Cidr("192.168.0.1/-1")).toBe(false);
      expect(isValidIpv4Cidr("192.168.0.1/")).toBe(false);
      expect(isValidIpv4Cidr("192.168.0.1/24/8")).toBe(false);
      expect(isValidIpv4Cidr("192.168.0.1/255.0.255.0")).toBe(false);
    });

    it("rejects the shorthand forms netmask would otherwise accept", () => {
      expect(isValidIpv4Cidr("192.168.1")).toBe(false);
      expect(isValidIpv4Cidr("1")).toBe(false);
      expect(isValidIpv4Cidr("010.0.0.1")).toBe(false);
      expect(isValidIpv4Cidr("0x7f.0.0.1")).toBe(false);
      expect(isValidIpv4Cidr("::1")).toBe(false);
      expect(isValidIpv4Cidr("2001:db8::/32")).toBe(false);
    });
  });

  describe("parseSubnet", () => {
    it("returns undefined for invalid input", () => {
      expect(parseSubnet("")).toBeUndefined();
      expect(parseSubnet("nope")).toBeUndefined();
    });

    it("parses the it-tools default sample", () => {
      const info = parseSubnet(DEFAULT_IP);
      expect(info).toEqual({
        netmask: "192.168.0.0/24",
        networkAddress: "192.168.0.0",
        networkMask: "255.255.255.0",
        networkMaskBinary: "11111111.11111111.11111111.00000000",
        cidr: "/24",
        wildcardMask: "0.0.0.255",
        networkSize: "256",
        firstAddress: "192.168.0.1",
        lastAddress: "192.168.0.254",
        broadcastAddress: "192.168.0.255",
        ipClass: "C",
      });
    });

    it("omits broadcast for /31 and /32", () => {
      expect(parseSubnet("10.0.0.0/31")?.broadcastAddress).toBeUndefined();
      expect(parseSubnet("10.0.0.1/32")?.broadcastAddress).toBeUndefined();
      expect(parseSubnet("10.0.0.1/32")?.networkSize).toBe("1");
    });

    it("exposes labeled sections matching it-tools order", () => {
      const sections = getSubnetSections(parseSubnet(DEFAULT_IP)!);
      expect(sections.map((s) => s.label)).toEqual([
        "Netmask",
        "Network address",
        "Network mask",
        "Network mask in binary",
        "CIDR notation",
        "Wildcard mask",
        "Network size",
        "First address",
        "Last address",
        "Broadcast address",
        "IP class",
      ]);
      expect(sections.find((s) => s.key === "broadcastAddress")?.undefinedFallback).toBe(
        "No broadcast address with this mask",
      );
      expect(sections.find((s) => s.key === "ipClass")?.value).toBe("C");
    });
  });

  describe("switchBlock", () => {
    it("moves to adjacent same-size blocks", () => {
      expect(switchBlock(DEFAULT_IP, 1)).toBe("192.168.1.0/24");
      expect(switchBlock(DEFAULT_IP, -1)).toBe("192.167.255.0/24");
    });

    it("returns undefined for invalid input", () => {
      expect(switchBlock("bad", 1)).toBeUndefined();
    });

    it("stops at the ends of the address space instead of wrapping", () => {
      expect(switchBlock("255.255.255.0/24", 1)).toBeUndefined();
      expect(switchBlock("255.255.255.0/24", -1)).toBe("255.255.254.0/24");
      expect(switchBlock("0.0.0.0/24", -1)).toBeUndefined();
      expect(switchBlock("0.0.0.0/24", 1)).toBe("0.0.1.0/24");
      expect(switchBlock("255.255.255.255", 1)).toBeUndefined();
      expect(switchBlock("255.255.255.254/32", 1)).toBe("255.255.255.255/32");
      expect(switchBlock("0.0.0.0/0", 1)).toBeUndefined();
      expect(switchBlock("0.0.0.0/0", -1)).toBeUndefined();
      expect(switchBlock("128.0.0.0/1", 1)).toBeUndefined();
      expect(switchBlock("128.0.0.0/1", -1)).toBe("0.0.0.0/1");
    });
  });

  describe("getNetworkInfo", () => {
    it("throws on invalid addresses", () => {
      expect(() => getNetworkInfo("not-an-ip")).toThrow();
    });
  });

  describe("edge masks (vectors from python ipaddress)", () => {
    const vectors: [string, string, string, string, number, string, string, string | undefined][] = [
      ["192.168.0.1/24", "192.168.0.0/24", "255.255.255.0", "0.0.0.255", 256, "192.168.0.1", "192.168.0.254", "192.168.0.255"],
      ["0.0.0.0/0", "0.0.0.0/0", "0.0.0.0", "255.255.255.255", 4294967296, "0.0.0.1", "255.255.255.254", "255.255.255.255"],
      ["10.0.0.0/31", "10.0.0.0/31", "255.255.255.254", "0.0.0.1", 2, "10.0.0.0", "10.0.0.1", undefined],
      ["10.0.0.1/32", "10.0.0.1/32", "255.255.255.255", "0.0.0.0", 1, "10.0.0.1", "10.0.0.1", undefined],
      ["255.255.255.255/32", "255.255.255.255/32", "255.255.255.255", "0.0.0.0", 1, "255.255.255.255", "255.255.255.255", undefined],
      ["255.255.255.254/31", "255.255.255.254/31", "255.255.255.254", "0.0.0.1", 2, "255.255.255.254", "255.255.255.255", undefined],
      ["172.16.5.9/20", "172.16.0.0/20", "255.255.240.0", "0.0.15.255", 4096, "172.16.0.1", "172.16.15.254", "172.16.15.255"],
      ["8.8.8.8/1", "0.0.0.0/1", "128.0.0.0", "127.255.255.255", 2147483648, "0.0.0.1", "127.255.255.254", "127.255.255.255"],
      ["128.0.0.1/255.128.0.0", "128.0.0.0/9", "255.128.0.0", "0.127.255.255", 8388608, "128.0.0.1", "128.127.255.254", "128.127.255.255"],
      ["10.1.2.3/0.0.0.0", "0.0.0.0/0", "0.0.0.0", "255.255.255.255", 4294967296, "0.0.0.1", "255.255.255.254", "255.255.255.255"],
    ];

    it.each(vectors)("%s", (input, netmask, mask, wildcard, size, first, last, broadcast) => {
      expect(parseSubnet(input)).toMatchObject({
        netmask,
        networkMask: mask,
        wildcardMask: wildcard,
        networkSize: String(size),
        firstAddress: first,
        lastAddress: last,
        broadcastAddress: broadcast,
      });
    });

    it("treats a bare address as /32", () => {
      expect(parseSubnet("255.255.255.255")?.netmask).toBe("255.255.255.255/32");
      expect(parseSubnet("0.0.0.0")?.cidr).toBe("/32");
    });

    it("prints the /0 and /32 binary masks", () => {
      expect(parseSubnet("0.0.0.0/0")?.networkMaskBinary).toBe("00000000.00000000.00000000.00000000");
      expect(parseSubnet("1.2.3.4/32")?.networkMaskBinary).toBe("11111111.11111111.11111111.11111111");
    });
  });
});

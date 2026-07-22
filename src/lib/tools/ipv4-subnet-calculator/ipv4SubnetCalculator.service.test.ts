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
  });

  describe("getNetworkInfo", () => {
    it("throws on invalid addresses", () => {
      expect(() => getNetworkInfo("not-an-ip")).toThrow();
    });
  });
});

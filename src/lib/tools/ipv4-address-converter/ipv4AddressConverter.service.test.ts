import { describe, expect, it } from "vitest";

import {
  getConversionSections,
  ipv4ToInt,
  ipv4ToIpv6,
  isValidIpv4,
} from "./ipv4AddressConverter.service";

describe("ipv4-address-converter", () => {
  describe("ipv4ToInt", () => {
    it("should convert an IPv4 address to an integer", () => {
      expect(ipv4ToInt({ ip: "192.168.0.1" })).toBe(3232235521);
      expect(ipv4ToInt({ ip: "10.0.0.1" })).toBe(167772161);
      expect(ipv4ToInt({ ip: "255.255.255.255" })).toBe(4294967295);
    });

    it("returns 0 for invalid input", () => {
      expect(ipv4ToInt({ ip: "256.0.0.1" })).toBe(0);
      expect(ipv4ToInt({ ip: "" })).toBe(0);
    });
  });

  describe("ipv4ToIpv6", () => {
    it("maps a valid IPv4 to the full and short IPv6 forms", () => {
      expect(ipv4ToIpv6({ ip: "192.168.1.1" })).toBe(
        "0000:0000:0000:0000:0000:ffff:c0a8:0101",
      );
      expect(ipv4ToIpv6({ ip: "192.168.1.1", prefix: "::ffff:" })).toBe(
        "::ffff:c0a8:0101",
      );
      expect(ipv4ToIpv6({ ip: "10.0.0.1" })).toBe(
        "0000:0000:0000:0000:0000:ffff:0a00:0001",
      );
    });

    it("returns empty string for invalid input", () => {
      expect(ipv4ToIpv6({ ip: "not-an-ip" })).toBe("");
    });
  });

  describe("isValidIpv4", () => {
    it("should return true for a valid IP address", () => {
      expect(isValidIpv4({ ip: "192.168.0.1" })).toEqual(true);
      expect(isValidIpv4({ ip: "10.0.0.1" })).toEqual(true);
    });

    it("should return false for an invalid IP address", () => {
      expect(isValidIpv4({ ip: "256.168.0.1" })).toEqual(false);
      expect(isValidIpv4({ ip: "192.168.0" })).toEqual(false);
      expect(isValidIpv4({ ip: "192.168.0.1.2" })).toEqual(false);
      expect(isValidIpv4({ ip: "192.168.0.1." })).toEqual(false);
      expect(isValidIpv4({ ip: ".192.168.0.1" })).toEqual(false);
      expect(isValidIpv4({ ip: "192.168.0.a" })).toEqual(false);
    });

    it("should return false for crap as input", () => {
      expect(isValidIpv4({ ip: "" })).toEqual(false);
      expect(isValidIpv4({ ip: " " })).toEqual(false);
      expect(isValidIpv4({ ip: "foo" })).toEqual(false);
      expect(isValidIpv4({ ip: "-1" })).toEqual(false);
      expect(isValidIpv4({ ip: "0" })).toEqual(false);
    });
  });

  describe("getConversionSections", () => {
    it("returns decimal, hex, binary, and IPv6 rows for a valid IP", () => {
      const sections = getConversionSections("192.168.1.1");
      expect(sections.map((s) => s.key)).toEqual([
        "decimal",
        "hexadecimal",
        "binary",
        "ipv6",
        "ipv6Short",
      ]);
      expect(sections.find((s) => s.key === "decimal")?.value).toBe("3232235777");
      expect(sections.find((s) => s.key === "hexadecimal")?.value).toBe("C0A80101");
      expect(sections.find((s) => s.key === "binary")?.value).toBe(
        "11000000101010000000000100000001",
      );
      expect(sections.find((s) => s.key === "ipv6")?.value).toBe(
        "0000:0000:0000:0000:0000:ffff:c0a8:0101",
      );
      expect(sections.find((s) => s.key === "ipv6Short")?.value).toBe(
        "::ffff:c0a8:0101",
      );
    });

    it("returns empty values for invalid input", () => {
      const sections = getConversionSections("bad");
      expect(sections.every((s) => s.value === "")).toBe(true);
    });
  });
});

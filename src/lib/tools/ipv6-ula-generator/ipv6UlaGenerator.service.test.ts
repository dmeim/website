import { describe, expect, it } from "vitest";

import {
  buildUlaFromHex40,
  emptyUlaSections,
  generateIpv6Ula,
  isValidMacAddress,
  sha1Hex,
} from "./ipv6UlaGenerator.service";

describe("ipv6-ula-generator", () => {
  describe("isValidMacAddress", () => {
    it("accepts colon or dash MACs with 3–6 octets", () => {
      expect(isValidMacAddress("20:37:06:12:34:56")).toBe(true);
      expect(isValidMacAddress("20-37-06-12-34-56")).toBe(true);
      expect(isValidMacAddress("aa:bb:cc")).toBe(true);
      expect(isValidMacAddress("aa:bb:cc:dd:ee")).toBe(true);
      expect(isValidMacAddress("  20:37:06:12:34:56  ")).toBe(true);
    });

    it("rejects invalid MACs", () => {
      expect(isValidMacAddress("")).toBe(false);
      expect(isValidMacAddress("gg:hh:ii:jj:kk:ll")).toBe(false);
      expect(isValidMacAddress("20:37")).toBe(false);
      expect(isValidMacAddress("20.37.06.12.34.56")).toBe(false);
      expect(isValidMacAddress("not-a-mac")).toBe(false);
    });
  });

  describe("sha1Hex", () => {
    it("matches known empty and sample digests", async () => {
      expect(await sha1Hex("")).toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
      expect(await sha1Hex("abc")).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
    });
  });

  describe("buildUlaFromHex40", () => {
    it("formats prefix, /48, and /64 bounds like it-tools", () => {
      const result = buildUlaFromHex40("abcdef0123");

      expect(result.prefix).toBe("fdab:cdef:0123");
      expect(result.ula).toBe("fdab:cdef:0123::/48");
      expect(result.firstRoutable).toBe("fdab:cdef:0123:0::/64");
      expect(result.lastRoutable).toBe("fdab:cdef:0123:ffff::/64");
      expect(result.sections.map((s) => s.value)).toEqual([
        "fdab:cdef:0123::/48",
        "fdab:cdef:0123:0::/64",
        "fdab:cdef:0123:ffff::/64",
      ]);
    });
  });

  describe("generateIpv6Ula", () => {
    it("returns null for an invalid MAC", async () => {
      expect(await generateIpv6Ula({ macAddress: "bad" })).toBeNull();
    });

    it("uses lower 40 bits of SHA-1(timestamp + mac)", async () => {
      const timestamp = 1_700_000_000_000;
      const macAddress = "20:37:06:12:34:56";
      const digest = await sha1Hex(String(timestamp) + macAddress);
      const expected = buildUlaFromHex40(digest.substring(30));

      const result = await generateIpv6Ula({ macAddress, timestamp });

      expect(result).toEqual(expected);
    });

    it("accepts an injected sha1 for deterministic output", async () => {
      const digest = "0123456789abcdef0123456789abcdef01234567";
      const result = await generateIpv6Ula({
        macAddress: "aa:bb:cc:dd:ee:ff",
        timestamp: 0,
        sha1: () => digest,
      });

      expect(result?.ula).toBe("fdef:0123:4567::/48");
      expect(result?.firstRoutable).toBe("fdef:0123:4567:0::/64");
      expect(result?.lastRoutable).toBe("fdef:0123:4567:ffff::/64");
    });
  });

  describe("emptyUlaSections", () => {
    it("returns three empty labeled rows", () => {
      expect(emptyUlaSections()).toEqual([
        { key: "ula", label: "IPv6 ULA", value: "" },
        { key: "firstRoutable", label: "First routable block", value: "" },
        { key: "lastRoutable", label: "Last routable block", value: "" },
      ]);
    });
  });
});

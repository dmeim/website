import { describe, expect, it } from "vitest";

import {
  DEFAULT_MAC_ADDRESS,
  getOuiKey,
  getVendorLines,
  isValidMacAddress,
  lookupMacVendor,
  type OuiVendorDb,
} from "./macAddressLookup.service";

const fixtureDb: OuiVendorDb = {
  "203706": "Cisco Systems, Inc\n80 West Tasman Drive\nSan Jose CA 94568\nUnited States",
  AABBCC: "Example Vendor\nExample City",
};

describe("mac-address-lookup", () => {
  describe("isValidMacAddress", () => {
    it("accepts 3–6 hex octets separated by : or -", () => {
      expect(isValidMacAddress("20:37:06:12:34:56")).toBe(true);
      expect(isValidMacAddress("20-37-06-12-34-56")).toBe(true);
      expect(isValidMacAddress("aa:bb:cc")).toBe(true);
      expect(isValidMacAddress("aa:bb:cc:dd:ee")).toBe(true);
      expect(isValidMacAddress("  20:37:06:12:34:56  ")).toBe(true);
    });

    it("rejects empty, dotted, or malformed values", () => {
      expect(isValidMacAddress("")).toBe(false);
      expect(isValidMacAddress("gg:hh:ii:jj:kk:ll")).toBe(false);
      expect(isValidMacAddress("20:37")).toBe(false);
      expect(isValidMacAddress("20.37.06.12.34.56")).toBe(false);
      expect(isValidMacAddress("not-a-mac")).toBe(false);
    });
  });

  describe("getOuiKey", () => {
    it("strips separators and returns the first 6 hex characters uppercased", () => {
      expect(getOuiKey("20:37:06:12:34:56")).toBe("203706");
      expect(getOuiKey("20-37-06-12-34-56")).toBe("203706");
      expect(getOuiKey("20.37.06.12.34.56")).toBe("203706");
      expect(getOuiKey("  aa:bb:cc:dd:ee:ff  ")).toBe("AABBCC");
      expect(getOuiKey("aabbccddeeff")).toBe("AABBCC");
    });

    it("handles short and empty input", () => {
      expect(getOuiKey("")).toBe("");
      expect(getOuiKey("aa:bb")).toBe("AABB");
      expect(getOuiKey("12")).toBe("12");
    });
  });

  describe("lookupMacVendor", () => {
    it("returns vendor info for a known OUI", () => {
      expect(lookupMacVendor(DEFAULT_MAC_ADDRESS, fixtureDb)).toBe(
        fixtureDb["203706"],
      );
      expect(lookupMacVendor("AA-BB-CC-00-11-22", fixtureDb)).toBe(
        fixtureDb.AABBCC,
      );
    });

    it("returns undefined for unknown or empty OUI", () => {
      expect(lookupMacVendor("FF:FF:FF:00:00:00", fixtureDb)).toBeUndefined();
      expect(lookupMacVendor("", fixtureDb)).toBeUndefined();
    });

    it("looks up against the bundled oui-data for the default Cisco MAC", () => {
      const vendor = lookupMacVendor(DEFAULT_MAC_ADDRESS);
      expect(vendor).toBeTruthy();
      expect(vendor).toContain("Cisco");
    });
  });

  describe("getVendorLines", () => {
    it("splits multiline vendor info", () => {
      expect(getVendorLines(fixtureDb["203706"])).toEqual([
        "Cisco Systems, Inc",
        "80 West Tasman Drive",
        "San Jose CA 94568",
        "United States",
      ]);
    });

    it("returns an empty list when vendor is missing", () => {
      expect(getVendorLines(undefined)).toEqual([]);
      expect(getVendorLines("")).toEqual([]);
    });
  });
});

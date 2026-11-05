import { describe, expect, it } from "vitest";

import {
  clampMacQuantity,
  generateMacAddresses,
  generateRandomMacAddress,
  isValidPartialMacAddress,
  normalizeMacCase,
  normalizeMacSeparator,
  splitPrefix,
} from "./macAddressGenerator.service";

function createRandomByteGenerator() {
  let i = 0;
  return () => (i++).toString(16).padStart(2, "0");
}

describe("mac-address-generator", () => {
  describe("splitPrefix", () => {
    it("splits a mac address prefix around non hex characters", () => {
      expect(splitPrefix("")).toEqual([]);
      expect(splitPrefix("01")).toEqual(["01"]);
      expect(splitPrefix("01:")).toEqual(["01"]);
      expect(splitPrefix("01:23")).toEqual(["01", "23"]);
      expect(splitPrefix("01-23")).toEqual(["01", "23"]);
    });

    it("groups continuous hex characters by 2", () => {
      expect(splitPrefix("0123")).toEqual(["01", "23"]);
      expect(splitPrefix("012345")).toEqual(["01", "23", "45"]);
      expect(splitPrefix("0123456")).toEqual(["01", "23", "45", "06"]);
    });
  });

  describe("generateRandomMacAddress", () => {
    it("generates a random mac address", () => {
      expect(
        generateRandomMacAddress({ getRandomByte: createRandomByteGenerator() }),
      ).toBe("00:01:02:03:04:05");
    });

    it("generates a random mac address with a prefix", () => {
      expect(
        generateRandomMacAddress({
          prefix: "ff:ee:aa",
          getRandomByte: createRandomByteGenerator(),
        }),
      ).toBe("ff:ee:aa:00:01:02");
      expect(
        generateRandomMacAddress({
          prefix: "ff:ee:a",
          getRandomByte: createRandomByteGenerator(),
        }),
      ).toBe("ff:ee:0a:00:01:02");
    });

    it("generates a random mac address with a prefix and a different separator", () => {
      expect(
        generateRandomMacAddress({
          prefix: "ff-ee-aa",
          separator: "-",
          getRandomByte: createRandomByteGenerator(),
        }),
      ).toBe("ff-ee-aa-00-01-02");
      expect(
        generateRandomMacAddress({
          prefix: "ff:ee:aa",
          separator: "-",
          getRandomByte: createRandomByteGenerator(),
        }),
      ).toBe("ff-ee-aa-00-01-02");
      expect(
        generateRandomMacAddress({
          prefix: "ff-ee:aa",
          separator: "-",
          getRandomByte: createRandomByteGenerator(),
        }),
      ).toBe("ff-ee-aa-00-01-02");
      expect(
        generateRandomMacAddress({
          prefix: "ff ee:aa",
          separator: "-",
          getRandomByte: createRandomByteGenerator(),
        }),
      ).toBe("ff-ee-aa-00-01-02");
    });
  });

  describe("isValidPartialMacAddress", () => {
    it("accepts empty and valid partial prefixes", () => {
      expect(isValidPartialMacAddress("")).toBe(true);
      expect(isValidPartialMacAddress("64:16:7F")).toBe(true);
      expect(isValidPartialMacAddress("64-16")).toBe(true);
      expect(isValidPartialMacAddress("aa")).toBe(true);
      expect(isValidPartialMacAddress("a")).toBe(true);
    });

    it("rejects invalid prefixes", () => {
      expect(isValidPartialMacAddress("gg")).toBe(false);
      expect(isValidPartialMacAddress("64:16:7F:ZZ")).toBe(false);
      expect(isValidPartialMacAddress("not-a-mac")).toBe(false);
      expect(isValidPartialMacAddress("a:b")).toBe(false);
      expect(isValidPartialMacAddress("64:16:7F:AA:BB:CC:DD")).toBe(false);
      expect(isValidPartialMacAddress("64:16:7F:AA:BB:CC:")).toBe(false);
      expect(isValidPartialMacAddress("64167FAABBCCDD")).toBe(false);
    });

    it("accepts bare hex, since the generator can output it", () => {
      expect(isValidPartialMacAddress("64167F")).toBe(true);
      expect(isValidPartialMacAddress("64167FAABBCC")).toBe(true);
    });
  });

  describe("generateMacAddresses", () => {
    it("returns uppercase newline-joined addresses by default", () => {
      expect(
        generateMacAddresses({
          quantity: 2,
          prefix: "ff:ee:aa",
          getRandomByte: createRandomByteGenerator(),
        }),
      ).toBe("FF:EE:AA:00:01:02\nFF:EE:AA:03:04:05");
    });

    it("applies lowercase and empty separator", () => {
      expect(
        generateMacAddresses({
          quantity: 1,
          prefix: "ff:ee",
          separator: "",
          caseStyle: "lower",
          getRandomByte: createRandomByteGenerator(),
        }),
      ).toBe("ffee00010203");
    });

    it("applies each separator and keeps a full six-octet prefix as is", () => {
      for (const [separator, expected] of [[":", "AA:BB:CC:00:01:02"], ["-", "AA-BB-CC-00-01-02"], [".", "AA.BB.CC.00.01.02"], ["", "AABBCC000102"]] as const) {
        expect(generateMacAddresses({ prefix: "aa:bb:cc", separator, getRandomByte: createRandomByteGenerator() })).toBe(expected);
      }
      expect(generateMacAddresses({ prefix: "01:23:45:67:89:ab", caseStyle: "lower" })).toBe("01:23:45:67:89:ab");
      expect(generateMacAddresses({ prefix: "  64167f  ", separator: "-", getRandomByte: createRandomByteGenerator() })).toBe("64-16-7F-00-01-02");
    });

    it("generates exactly the requested count of six-octet addresses", () => {
      const lines = generateMacAddresses({ quantity: 100, prefix: "" }).split("\n");
      expect(lines).toHaveLength(100);
      for (const line of lines) {
        expect(line).toMatch(/^[0-9A-F]{2}(:[0-9A-F]{2}){5}$/);
      }
    });

    it("returns empty string for invalid prefix", () => {
      expect(
        generateMacAddresses({
          prefix: "not-valid",
          getRandomByte: createRandomByteGenerator(),
        }),
      ).toBe("");
    });
  });

  describe("clamp / normalize helpers", () => {
    it("clamps quantity to 1–100", () => {
      expect(clampMacQuantity(0)).toBe(1);
      expect(clampMacQuantity(50)).toBe(50);
      expect(clampMacQuantity(999)).toBe(100);
      expect(clampMacQuantity("abc")).toBe(1);
    });

    it("normalizes separator and case", () => {
      expect(normalizeMacSeparator("-")).toBe("-");
      expect(normalizeMacSeparator("x")).toBe(":");
      expect(normalizeMacCase("lower")).toBe("lower");
      expect(normalizeMacCase("weird")).toBe("upper");
    });
  });
});

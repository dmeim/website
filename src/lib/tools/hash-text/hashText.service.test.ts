import { describe, expect, it } from "vitest";

import {
  HASH_ALGORITHMS,
  HASH_ENCODING_DEFAULT,
  convertHexToBin,
  hashAll,
  hashText,
  isHashEncoding,
  normalizeHashEncoding,
} from "./hashText.service";

describe("hash-text", () => {
  describe("convertHexToBin", () => {
    it("converts hex to bin", () => {
      expect(convertHexToBin("")).toEqual("");
      expect(convertHexToBin("FF")).toEqual("11111111");
      expect(convertHexToBin("F".repeat(200))).toEqual("1111".repeat(200));
      expect(convertHexToBin("2123006AD00F694CE120")).toEqual(
        "00100001001000110000000001101010110100000000111101101001010011001110000100100000",
      );
    });
  });

  describe("encoding helpers", () => {
    it("validates and normalizes encodings", () => {
      expect(isHashEncoding("Hex")).toBe(true);
      expect(isHashEncoding("Bin")).toBe(true);
      expect(isHashEncoding("nope")).toBe(false);
      expect(normalizeHashEncoding("Base64")).toBe("Base64");
      expect(normalizeHashEncoding("nope")).toBe(HASH_ENCODING_DEFAULT);
      expect(normalizeHashEncoding(undefined, "Bin")).toBe("Bin");
    });
  });

  describe("hashText", () => {
    it("hashes the empty string with known digests", () => {
      expect(hashText("MD5", "")).toBe("d41d8cd98f00b204e9800998ecf8427e");
      expect(hashText("SHA1", "")).toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
      expect(hashText("SHA256", "")).toBe(
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      );
    });

    it("hashes a sample string across encodings", () => {
      const text = "hello";
      const hex = hashText("SHA256", text, "Hex");

      expect(hex).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
      expect(hashText("SHA256", text, "Bin")).toBe(convertHexToBin(hex));
      expect(hashText("SHA256", text, "Base64")).toMatch(/^[A-Za-z0-9+/]+=*$/);
      expect(hashText("SHA256", text, "Base64url")).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("produces distinct digests per algorithm", () => {
      const digests = HASH_ALGORITHMS.map((algo) => hashText(algo, "parity-check"));
      expect(new Set(digests).size).toBe(HASH_ALGORITHMS.length);
    });
  });

  describe("hashAll", () => {
    it("returns an entry for every algorithm", () => {
      const all = hashAll("test", "Hex");

      for (const algo of HASH_ALGORITHMS) {
        expect(all[algo]).toBe(hashText(algo, "test", "Hex"));
        expect(all[algo].length).toBeGreaterThan(0);
      }
    });
  });
});

import { createHash } from "node:crypto";

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

  describe("matches node:crypto", () => {
    const NODE_NAMES = {
      MD5: "md5",
      SHA1: "sha1",
      SHA256: "sha256",
      SHA224: "sha224",
      SHA512: "sha512",
      SHA384: "sha384",
      SHA3: "sha3-512",
      RIPEMD160: "ripemd160",
    } as const;

    // 71, 72, and 73 bytes straddle the SHA3-512 block boundary, where padding is easiest to get wrong.
    const INPUTS = ["", "hello", "héllo wörld 😀", "a".repeat(71), "a".repeat(72), "a".repeat(73), "a".repeat(1000)];

    for (const [algo, nodeName] of Object.entries(NODE_NAMES)) {
      it(`${algo} agrees across inputs and encodings`, () => {
        for (const input of INPUTS) {
          const expected = createHash(nodeName).update(input, "utf8").digest();
          const name = algo as keyof typeof NODE_NAMES;
          expect(hashText(name, input, "Hex")).toBe(expected.toString("hex"));
          expect(hashText(name, input, "Base64")).toBe(expected.toString("base64"));
          expect(hashText(name, input, "Base64url")).toBe(expected.toString("base64url"));
        }
      });
    }

    it("keeps the pre-standard Keccak-512 digest it-tools labels SHA3", () => {
      expect(hashText("Keccak512", "")).toBe(
        "0eab42de4c3ceb9235fc91acffe746b29c29a8c366b7c60e4e67c466f36a4304c00fa9caf9d87976ba469bcbe06713b435f091ef2769fb160cdab33d3670680e",
      );
    });
  });
});

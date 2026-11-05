import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { convertHexToBin } from "@/lib/tools/hash-text";

import {
  HASH_ALGORITHMS,
  HASH_ENCODING_DEFAULT,
  HMAC_ALGORITHM_DEFAULT,
  hmacText,
  isHashAlgorithm,
  normalizeHashAlgorithm,
  normalizeHashEncoding,
} from "./hmacGenerator.service";

describe("hmac-generator", () => {
  describe("algorithm helpers", () => {
    it("validates and normalizes algorithms", () => {
      expect(isHashAlgorithm("SHA256")).toBe(true);
      expect(isHashAlgorithm("MD5")).toBe(true);
      expect(isHashAlgorithm("nope")).toBe(false);
      expect(normalizeHashAlgorithm("SHA512")).toBe("SHA512");
      expect(normalizeHashAlgorithm("nope")).toBe(HMAC_ALGORITHM_DEFAULT);
      expect(normalizeHashAlgorithm(undefined, "MD5")).toBe("MD5");
    });

    it("defaults to SHA256 and Hex", () => {
      expect(HMAC_ALGORITHM_DEFAULT).toBe("SHA256");
      expect(HASH_ENCODING_DEFAULT).toBe("Hex");
      expect(normalizeHashEncoding("nope")).toBe("Hex");
    });
  });

  describe("hmacText", () => {
    it("computes HMAC for empty message and empty key", () => {
      expect(hmacText("SHA256", "", "")).toBe(
        "b613679a0814d9ec772f95d778c35fc5ff1697c493715653c6c712144292c5ad",
      );
      expect(hmacText("MD5", "", "")).toBe("74e6f7298a9c2d168935f58c001bad88");
      expect(hmacText("SHA1", "", "")).toBe("fbdb1d1b18aa6c08324b7d64b71fb76370690e1d");
    });

    it("computes HMAC for hello + secret across encodings", () => {
      const hex = hmacText("SHA256", "hello", "secret", "Hex");

      expect(hex).toBe("88aab3ede8d3adf94d26ab90d3bafd4a2083070c3bcce9c014ee04a443847c0b");
      expect(hmacText("SHA256", "hello", "secret")).toBe(hex);
      expect(hmacText("SHA256", "hello", "secret", "Bin")).toBe(convertHexToBin(hex));
      expect(hmacText("SHA256", "hello", "secret", "Base64")).toBe(
        "iKqz7ejTrflNJquQ07r9SiCDBww7zOnAFO4EpEOEfAs=",
      );
      expect(hmacText("SHA256", "hello", "secret", "Base64url")).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("produces distinct digests per algorithm", () => {
      const digests = HASH_ALGORITHMS.map((algo) => hmacText(algo, "parity-check", "key"));
      expect(new Set(digests).size).toBe(HASH_ALGORITHMS.length);
    });

    it("changes when the secret changes", () => {
      const a = hmacText("SHA256", "message", "key-a");
      const b = hmacText("SHA256", "message", "key-b");
      expect(a).not.toBe(b);
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

    // The long key exercises the hash-the-key path; 72 bytes is the SHA3-512 block size.
    const CASES = [
      ["", ""],
      ["hello", "secret"],
      ["héllo 😀", "clé 🔑"],
      ["message", "k".repeat(72)],
      ["message", "k".repeat(200)],
    ] as const;

    for (const [algo, nodeName] of Object.entries(NODE_NAMES)) {
      it(`${algo} agrees across keys and encodings`, () => {
        for (const [message, key] of CASES) {
          const expected = createHmac(nodeName, key).update(message, "utf8").digest();
          const name = algo as keyof typeof NODE_NAMES;
          expect(hmacText(name, message, key, "Hex")).toBe(expected.toString("hex"));
          expect(hmacText(name, message, key, "Base64")).toBe(expected.toString("base64"));
          expect(hmacText(name, message, key, "Base64url")).toBe(expected.toString("base64url"));
        }
      });
    }

    it("matches the RFC 4231 HMAC-SHA-256 test case 2", () => {
      expect(hmacText("SHA256", "what do ya want for nothing?", "Jefe")).toBe(
        "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
      );
    });
  });
});

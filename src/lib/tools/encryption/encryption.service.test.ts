import { describe, expect, it } from "vitest";

import {
  DECRYPT_ERROR_MESSAGE,
  ENCRYPTION_ALGORITHMS,
  ENCRYPTION_ALGORITHM_DEFAULT,
  ENCRYPTION_SAMPLE_CIPHERTEXT,
  ENCRYPTION_SAMPLE_PLAINTEXT,
  ENCRYPTION_SAMPLE_SECRET,
  OPENSSL_SALTED_BASE64_PREFIX,
  decryptText,
  encryptText,
  isEncryptionAlgorithm,
  normalizeEncryptionAlgorithm,
  tryDecrypt,
} from "./encryption.service";

describe("encryption", () => {
  describe("algorithm helpers", () => {
    it("validates and normalizes algorithms", () => {
      expect(isEncryptionAlgorithm("AES")).toBe(true);
      expect(isEncryptionAlgorithm("TripleDES")).toBe(true);
      expect(isEncryptionAlgorithm("Rabbit")).toBe(true);
      expect(isEncryptionAlgorithm("RC4")).toBe(true);
      expect(isEncryptionAlgorithm("nope")).toBe(false);
      expect(normalizeEncryptionAlgorithm("RC4")).toBe("RC4");
      expect(normalizeEncryptionAlgorithm("nope")).toBe(ENCRYPTION_ALGORITHM_DEFAULT);
      expect(normalizeEncryptionAlgorithm(undefined, "Rabbit")).toBe("Rabbit");
    });

    it("defaults to AES", () => {
      expect(ENCRYPTION_ALGORITHM_DEFAULT).toBe("AES");
      expect(ENCRYPTION_ALGORITHMS).toEqual(["AES", "TripleDES", "Rabbit", "RC4"]);
    });
  });

  describe("encryptText / decryptText", () => {
    it("round-trips plaintext for all four algorithms", () => {
      const plaintext = "parity-check payload";
      const secret = "test-secret";

      for (const algo of ENCRYPTION_ALGORITHMS) {
        const ciphertext = encryptText(algo, plaintext, secret);
        expect(ciphertext.startsWith(OPENSSL_SALTED_BASE64_PREFIX)).toBe(true);
        expect(decryptText(algo, ciphertext, secret)).toBe(plaintext);
      }
    });

    it("emits OpenSSL Salted__ Base64 (U2FsdGVkX1 prefix)", () => {
      const ciphertext = encryptText("AES", "hello", "key");
      expect(ciphertext.startsWith(OPENSSL_SALTED_BASE64_PREFIX)).toBe(true);
      // Decoded OpenSSL header is ASCII "Salted__" (8 bytes)
      expect(Buffer.from(ciphertext, "base64").subarray(0, 8).toString("utf8")).toBe("Salted__");
    });

    it("produces different ciphertext each encrypt (random salt)", () => {
      const a = encryptText("AES", "same", "key");
      const b = encryptText("AES", "same", "key");
      expect(a).not.toBe(b);
      expect(decryptText("AES", a, "key")).toBe("same");
      expect(decryptText("AES", b, "key")).toBe("same");
    });

    it("decrypts the it-tools sample AES ciphertext", () => {
      expect(decryptText("AES", ENCRYPTION_SAMPLE_CIPHERTEXT, ENCRYPTION_SAMPLE_SECRET)).toBe(
        ENCRYPTION_SAMPLE_PLAINTEXT,
      );
    });
  });

  describe("tryDecrypt", () => {
    it("returns ok text on success", () => {
      const ciphertext = encryptText("AES", "round-trip", "secret");
      expect(tryDecrypt("AES", ciphertext, "secret")).toEqual({
        ok: true,
        text: "round-trip",
      });
    });

    it("maps wrong key to a stable error", () => {
      const ciphertext = encryptText("AES", "secret message", "right-key");
      expect(tryDecrypt("AES", ciphertext, "wrong-key")).toEqual({
        ok: false,
        error: DECRYPT_ERROR_MESSAGE,
      });
    });

    it("maps wrong algorithm to a stable error", () => {
      const ciphertext = encryptText("AES", "secret message", "key");
      expect(tryDecrypt("TripleDES", ciphertext, "key")).toEqual({
        ok: false,
        error: DECRYPT_ERROR_MESSAGE,
      });
    });

    it("maps garbage ciphertext to a stable error", () => {
      expect(tryDecrypt("AES", "not-a-ciphertext", "key")).toEqual({
        ok: false,
        error: DECRYPT_ERROR_MESSAGE,
      });
    });

    it("does not leak crypto-js Malformed UTF-8 messages", () => {
      const result = tryDecrypt("AES", ENCRYPTION_SAMPLE_CIPHERTEXT, "not the sample key");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(DECRYPT_ERROR_MESSAGE);
        expect(result.error).not.toMatch(/Malformed|UTF-8/i);
      }
    });
  });

  describe("OpenSSL interop (openssl enc -aes-256-cbc -md md5 -a -salt)", () => {
    it("decrypts OpenSSL output, including non-ASCII text", () => {
      expect(decryptText("AES", "U2FsdGVkX19GPAgEDh5n2iwJConuoAUIkKu5Ih1OTswXFQmKi/wwIhQIaJttLhwc", "hunter2")).toBe(
        "Lorem ipsum, señor 😀",
      );
    });

    it("decrypts line-wrapped OpenSSL output and pasted trailing newlines", () => {
      const wrapped =
        "U2FsdGVkX19Bak9oiN151xsAwmPhA4GLIMiMYDg+45FCuvO6rCQHyNNyloTaunCq\nEGRZUJrny3AVfmfK1iKfrwC/jb4UZ909Ra3ta7uKFj3KeCfetL1hbmmZ4xm5DTTA\nVg5ykNL4ODP8L678Dxh7qg==\n";
      expect(tryDecrypt("AES", wrapped, "hunter2")).toEqual({ ok: true, text: "x".repeat(80) });
    });
  });

  describe("empty plaintext", () => {
    it("round-trips for every algorithm rather than reporting a failure", () => {
      for (const algo of ENCRYPTION_ALGORITHMS) {
        expect(tryDecrypt(algo, encryptText(algo, "", "key"), "key")).toEqual({ ok: true, text: "" });
      }
    });

    it("treats empty ciphertext as an empty state", () => {
      expect(tryDecrypt("AES", "", "key")).toEqual({ ok: true, text: "" });
      expect(tryDecrypt("AES", "  \n", "key")).toEqual({ ok: true, text: "" });
    });
  });
});

import { describe, expect, it } from "vitest";

import {
  RSA_BITS_AUTO_REGEN_MAX,
  RSA_BITS_DEFAULT,
  RSA_BITS_MAX,
  RSA_BITS_MIN,
  RSA_PRIVATE_PEM_LABEL,
  RSA_PUBLIC_PEM_LABEL,
  arrayBufferToBase64,
  arrayBufferToPem,
  generateRsaKeyPair,
  isValidRsaBits,
  normalizeRsaBits,
  wrapPem,
} from "./rsaKeyPairGenerator.service";

function utf8Bytes(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer;
}

describe("rsa-key-pair-generator", () => {
  describe("isValidRsaBits", () => {
    it("accepts integers in range that are multiples of 8", () => {
      expect(isValidRsaBits(256)).toBe(true);
      expect(isValidRsaBits(2048)).toBe(true);
      expect(isValidRsaBits(4096)).toBe(true);
      expect(isValidRsaBits(16384)).toBe(true);
    });

    it("rejects out of range, non-multiples, and non-integers", () => {
      expect(isValidRsaBits(255)).toBe(false);
      expect(isValidRsaBits(257)).toBe(false);
      expect(isValidRsaBits(250)).toBe(false);
      expect(isValidRsaBits(16385)).toBe(false);
      expect(isValidRsaBits(2048.5)).toBe(false);
      expect(isValidRsaBits("2048")).toBe(false);
      expect(isValidRsaBits(NaN)).toBe(false);
      expect(isValidRsaBits(undefined)).toBe(false);
    });
  });

  describe("normalizeRsaBits", () => {
    it("defaults invalid / non-finite input", () => {
      expect(normalizeRsaBits(undefined)).toBe(RSA_BITS_DEFAULT);
      expect(normalizeRsaBits("")).toBe(RSA_BITS_DEFAULT);
      expect(normalizeRsaBits(NaN)).toBe(RSA_BITS_DEFAULT);
      expect(normalizeRsaBits("nope", 1024)).toBe(1024);
    });

    it("clamps and rounds to a multiple of 8", () => {
      expect(normalizeRsaBits(100)).toBe(RSA_BITS_MIN);
      expect(normalizeRsaBits(20000)).toBe(RSA_BITS_MAX);
      expect(normalizeRsaBits(2050)).toBe(2048);
      expect(normalizeRsaBits(2052)).toBe(2056);
      expect(normalizeRsaBits("4096")).toBe(4096);
    });

    it("exposes auto-regen threshold used by the UI", () => {
      expect(RSA_BITS_AUTO_REGEN_MAX).toBe(4096);
      expect(isValidRsaBits(RSA_BITS_AUTO_REGEN_MAX)).toBe(true);
    });
  });

  describe("PEM helpers", () => {
    it("encodes ArrayBuffer to Base64", () => {
      expect(arrayBufferToBase64(utf8Bytes("hello"))).toBe("aGVsbG8=");
      expect(arrayBufferToBase64(new ArrayBuffer(0))).toBe("");
    });

    it("wraps Base64 into 64-column PEM lines", () => {
      const long = "A".repeat(130);
      const pem = wrapPem(long, "PUBLIC KEY");
      const body = pem
        .split("\n")
        .filter((line) => !line.startsWith("-----"))
        .join("\n");

      expect(pem.startsWith("-----BEGIN PUBLIC KEY-----")).toBe(true);
      expect(pem.endsWith("-----END PUBLIC KEY-----")).toBe(true);
      expect(body.split("\n")).toEqual(["A".repeat(64), "A".repeat(64), "AA"]);
    });

    it("strips whitespace from Base64 before wrapping", () => {
      const pem = wrapPem("YWJj\nZGVm", "TEST");
      expect(pem).toContain("YWJjZGVm");
      expect(pem).not.toContain("\nYWJj\n");
    });

    it("arrayBufferToPem combines base64 + wrap", () => {
      const pem = arrayBufferToPem(utf8Bytes("hi"), RSA_PUBLIC_PEM_LABEL);
      expect(pem).toBe(
        `-----BEGIN ${RSA_PUBLIC_PEM_LABEL}-----\naGk=\n-----END ${RSA_PUBLIC_PEM_LABEL}-----`,
      );
    });
  });

  describe("generateRsaKeyPair", () => {
    it("generates SPKI public + PKCS#8 private PEM via Web Crypto", async () => {
      if (!globalThis.crypto?.subtle) {
        return;
      }

      // 1024-bit keeps the suite fast while exercising SubtleCrypto.
      const pair = await generateRsaKeyPair({ bits: 1024 });

      expect(pair.publicKeyPem).toMatch(/^-----BEGIN PUBLIC KEY-----/);
      expect(pair.publicKeyPem).toMatch(/-----END PUBLIC KEY-----$/);
      expect(pair.privateKeyPem).toMatch(/^-----BEGIN PRIVATE KEY-----/);
      expect(pair.privateKeyPem).toMatch(/-----END PRIVATE KEY-----$/);

      expect(pair.publicKeyPem).toContain(RSA_PUBLIC_PEM_LABEL);
      expect(pair.privateKeyPem).toContain(RSA_PRIVATE_PEM_LABEL);
      // PKCS#8, not forge PKCS#1 RSA PRIVATE KEY
      expect(pair.privateKeyPem).not.toContain("BEGIN RSA PRIVATE KEY");

      const publicBody = pair.publicKeyPem
        .split("\n")
        .filter((line) => line && !line.startsWith("-----"));
      for (const line of publicBody) {
        expect(line.length).toBeLessThanOrEqual(64);
      }
    }, 30_000);

    it("defaults omitted bits to 2048 via normalize", () => {
      expect(normalizeRsaBits(undefined)).toBe(RSA_BITS_DEFAULT);
      expect(RSA_BITS_DEFAULT).toBe(2048);
    });
  });
});

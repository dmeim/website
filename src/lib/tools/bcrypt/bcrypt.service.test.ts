import { describe, expect, it } from "vitest";

import {
  BCRYPT_ROUNDS_DEFAULT,
  BCRYPT_ROUNDS_MAX,
  BCRYPT_ROUNDS_MIN,
  clampSaltRounds,
  comparePassword,
  hashPassword,
  isBcryptHash,
  passwordTruncates,
} from "./bcrypt.service";

describe("bcrypt", () => {
  describe("clampSaltRounds", () => {
    it("clamps to the it-tools 0–100 range", () => {
      expect(clampSaltRounds(10)).toBe(10);
      expect(clampSaltRounds(0)).toBe(BCRYPT_ROUNDS_MIN);
      expect(clampSaltRounds(100)).toBe(BCRYPT_ROUNDS_MAX);
      expect(clampSaltRounds(-5)).toBe(BCRYPT_ROUNDS_MIN);
      expect(clampSaltRounds(250)).toBe(BCRYPT_ROUNDS_MAX);
      expect(clampSaltRounds(10.9)).toBe(10);
      expect(clampSaltRounds("12")).toBe(12);
      expect(clampSaltRounds("nope")).toBe(BCRYPT_ROUNDS_DEFAULT);
      expect(clampSaltRounds(undefined)).toBe(BCRYPT_ROUNDS_DEFAULT);
      expect(clampSaltRounds(Number.NaN, 8)).toBe(8);
    });
  });

  describe("isBcryptHash", () => {
    it("accepts modular crypt bcrypt hashes", async () => {
      const hash = await hashPassword("probe", 4);
      expect(isBcryptHash(hash)).toBe(true);
      expect(isBcryptHash(`  ${hash}  `)).toBe(true);
    });

    it("rejects empty and malformed strings", () => {
      expect(isBcryptHash("")).toBe(false);
      expect(isBcryptHash("not-a-hash")).toBe(false);
      expect(isBcryptHash("$2b$10$too-short")).toBe(false);
      expect(isBcryptHash("$2x$10$eImiTXuWVxfM37uY4JANjQ.Exm.5b8n8j8j8j8j8j8j8j8j8j8j8j8")).toBe(
        false,
      );
    });
  });

  describe("hashPassword / comparePassword", () => {
    it("hashes and verifies a password", async () => {
      const hash = await hashPassword("secret", 4);

      expect(hash).toMatch(/^\$2[aby]\$04\$/);
      expect(await comparePassword("secret", hash)).toBe(true);
      expect(await comparePassword("wrong", hash)).toBe(false);
    });

    it("hashes the empty string", async () => {
      const hash = await hashPassword("", 4);
      expect(isBcryptHash(hash)).toBe(true);
      expect(await comparePassword("", hash)).toBe(true);
      expect(await comparePassword("x", hash)).toBe(false);
    });

    it("guards empty and invalid compare hashes", async () => {
      expect(await comparePassword("secret", "")).toBe(false);
      expect(await comparePassword("secret", "   ")).toBe(false);
      expect(await comparePassword("secret", "not-a-hash")).toBe(false);
    });

    it("embeds the clamped cost in the hash prefix", async () => {
      const hash = await hashPassword("rounds-check", 4);
      expect(hash).toMatch(/^\$2[aby]\$04\$/);
      // Clamping is covered by clampSaltRounds; avoid hashing at cost 100 in tests.
      expect(clampSaltRounds(250)).toBe(BCRYPT_ROUNDS_MAX);
    });
  });

  describe("passwordTruncates", () => {
    it("detects passwords longer than 72 bytes", () => {
      expect(passwordTruncates("short")).toBe(false);
      expect(passwordTruncates("x".repeat(72))).toBe(false);
      expect(passwordTruncates("x".repeat(73))).toBe(true);
    });
  });
});

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
    it("clamps to the 4–31 range bcrypt supports", () => {
      expect(BCRYPT_ROUNDS_MIN).toBe(4);
      expect(BCRYPT_ROUNDS_MAX).toBe(31);
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
      expect(isBcryptHash(`$2b$99$${"a".repeat(53)}`)).toBe(false);
      expect(isBcryptHash(`$2b$03$${"a".repeat(53)}`)).toBe(false);
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
      expect(await hashPassword("rounds-check", 0)).toMatch(/^\$2[aby]\$04\$/);
    });
  });

  describe("passwordTruncates", () => {
    it("detects passwords longer than 72 bytes", () => {
      expect(passwordTruncates("short")).toBe(false);
      expect(passwordTruncates("x".repeat(72))).toBe(false);
      expect(passwordTruncates("x".repeat(73))).toBe(true);
    });
  });

  describe("independent vectors", () => {
    it("verifies the jBCrypt empty-string vector", async () => {
      expect(await comparePassword("", "$2a$06$DCq7YPn5Rq63x1Lad4cll.TV4S6ytwfsfvkgY8jIucDrjc8deX1s.")).toBe(true);
    });

    it("verifies hashes produced by Apache htpasswd", async () => {
      const ascii = "$2y$06$N59e2V1VbQJ/1Gy.23FaHuOS6gr1pd.vGCRRzTFyXjTS5QlGUzZhi";
      expect(await comparePassword("correct horse", ascii)).toBe(true);
      expect(await comparePassword("correct horse!", ascii)).toBe(false);
      expect(await comparePassword("pässwörd😀", "$2y$04$JcckjViAcv7F0wgcwwVOyO8Lrlpi57bjlUa.B4q69gfUFQc4U5m3y")).toBe(true);
    });

    it("treats hash surrounding whitespace as a paste artifact", async () => {
      expect(await comparePassword("correct horse", " $2y$06$N59e2V1VbQJ/1Gy.23FaHuOS6gr1pd.vGCRRzTFyXjTS5QlGUzZhi\n")).toBe(true);
    });
  });
});

import { describe, expect, it } from "vitest";

import {
  LOWERCASE_ALPHABET,
  TOKEN_LENGTH_MAX,
  TOKEN_LENGTH_MIN,
  UPPERCASE_ALPHABET,
  buildTokenAlphabet,
  clampTokenLength,
  createToken,
} from "./tokenGenerator.service";

describe("token-generator", () => {
  describe("clampTokenLength", () => {
    it("clamps to the supported range", () => {
      expect(clampTokenLength(0)).toBe(TOKEN_LENGTH_MIN);
      expect(clampTokenLength(-5)).toBe(TOKEN_LENGTH_MIN);
      expect(clampTokenLength(999)).toBe(TOKEN_LENGTH_MAX);
      expect(clampTokenLength(64)).toBe(64);
    });

    it("falls back for non-finite values", () => {
      expect(clampTokenLength(Number.NaN, 32)).toBe(32);
      expect(clampTokenLength("nope", 16)).toBe(16);
    });
  });

  describe("buildTokenAlphabet", () => {
    it("returns an empty alphabet when all classes are off", () => {
      expect(
        buildTokenAlphabet({
          withLowercase: false,
          withUppercase: false,
          withNumbers: false,
          withSymbols: false,
        }),
      ).toBe("");
    });

    it("prefers a custom alphabet when provided", () => {
      expect(buildTokenAlphabet({ alphabet: "abc" })).toBe("abc");
    });
  });

  describe("createToken", () => {
    it("should generate an empty string when all params are false", () => {
      const token = createToken({
        withLowercase: false,
        withUppercase: false,
        withNumbers: false,
        withSymbols: false,
        length: 10,
      });

      expect(token).toHaveLength(0);
    });

    it("should generate a random string with the specified length", () => {
      const createTokenWithLength = (length: number) =>
        createToken({
          withLowercase: true,
          withUppercase: true,
          withNumbers: true,
          withSymbols: true,
          length,
        });

      expect(createTokenWithLength(5)).toHaveLength(5);
      expect(createTokenWithLength(10)).toHaveLength(10);
      expect(createTokenWithLength(100)).toHaveLength(100);
    });

    it("should generate a random string with just uppercase if only withUppercase is set", () => {
      const token = createToken({
        withLowercase: false,
        withUppercase: true,
        withNumbers: false,
        withSymbols: false,
        length: 256,
      });

      expect(token).toHaveLength(256);
      expect(token).toMatch(/^[A-Z]+$/);
      expect(UPPERCASE_ALPHABET).toContain("N");
    });

    it("should generate a random string with just lowercase if only withLowercase is set", () => {
      const token = createToken({
        withLowercase: true,
        withUppercase: false,
        withNumbers: false,
        withSymbols: false,
        length: 256,
      });

      expect(token).toHaveLength(256);
      expect(token).toMatch(/^[a-z]+$/);
      expect(LOWERCASE_ALPHABET).toContain("n");
    });

    it("should generate a random string with just numbers if only withNumbers is set", () => {
      const token = createToken({
        withLowercase: false,
        withUppercase: false,
        withNumbers: true,
        withSymbols: false,
        length: 256,
      });

      expect(token).toHaveLength(256);
      expect(token).toMatch(/^[0-9]+$/);
    });

    it("should generate a random string with just symbols if only withSymbols is set", () => {
      const token = createToken({
        withLowercase: false,
        withUppercase: false,
        withNumbers: false,
        withSymbols: true,
        length: 256,
      });

      expect(token).toHaveLength(256);
      expect(token).toMatch(/^[.,;:!?./\-"'#{([-|\\@)\]=}*+]+$/);
    });

    it("should generate a random string with just letters when only letter toggles are on", () => {
      const token = createToken({
        withLowercase: true,
        withUppercase: true,
        withNumbers: false,
        withSymbols: false,
        length: 256,
      });

      expect(token).toHaveLength(256);
      expect(token).toMatch(/^[a-zA-Z]+$/);
    });

    it("should honor a custom alphabet", () => {
      const token = createToken({ alphabet: "ab", length: 64 });

      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[ab]+$/);
    });
  });
});

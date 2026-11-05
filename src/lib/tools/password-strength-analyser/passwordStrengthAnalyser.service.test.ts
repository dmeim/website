import { describe, expect, it } from "vitest";

import {
  getCharsetLength,
  getPasswordCrackTimeEstimation,
} from "./passwordStrengthAnalyser.service";

describe("password-strength-analyser", () => {
  describe("getCharsetLength", () => {
    it("returns 26 for lowercase-only passwords", () => {
      expect(getCharsetLength({ password: "abcdefghijklmnopqrstuvwxyz" })).toBe(26);
    });

    it("returns 26 for uppercase-only passwords", () => {
      expect(getCharsetLength({ password: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" })).toBe(26);
    });

    it("returns 10 for digit-only passwords", () => {
      expect(getCharsetLength({ password: "0123456789" })).toBe(10);
    });

    it("returns 32 for special-character-only passwords", () => {
      expect(getCharsetLength({ password: "-_(" })).toBe(32);
    });

    it("returns 0 for an empty password", () => {
      expect(getCharsetLength({ password: "" })).toBe(0);
    });

    it("returns 36 for lowercase characters and digits", () => {
      expect(getCharsetLength({ password: "abcdefghijklmnopqrstuvwxyz0123456789" })).toBe(36);
    });

    it("returns 94 for the full printable set (not 95)", () => {
      expect(
        getCharsetLength({
          password: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_(",
        }),
      ).toBe(94);
    });
  });

  describe("getPasswordCrackTimeEstimation", () => {
    it("returns zero entropy and charset for an empty password", () => {
      const result = getPasswordCrackTimeEstimation({ password: "" });
      expect(result.entropy).toBe(0);
      expect(result.charsetLength).toBe(0);
      expect(result.passwordLength).toBe(0);
      expect(result.score).toBe(0);
      expect(result.crackDurationFormatted).toBe("Instantly");
    });

    it("computes entropy as log2(charset) * length", () => {
      const result = getPasswordCrackTimeEstimation({ password: "abc" });
      expect(result.charsetLength).toBe(26);
      expect(result.passwordLength).toBe(3);
      expect(result.entropy).toBeCloseTo(Math.log2(26) * 3, 10);
    });

    it("clamps score to 1 when entropy exceeds 128", () => {
      const result = getPasswordCrackTimeEstimation({
        password: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_(",
      });
      expect(result.score).toBe(1);
      expect(result.entropy).toBeGreaterThan(128);
    });

    it("formats short crack times as less than a second", () => {
      // lowercase ×5 → ~0.01s at 1e9 guesses/s (above Instantly, at or below 1s)
      const result = getPasswordCrackTimeEstimation({ password: "aaaaa" });
      expect(result.crackDurationFormatted).toBe("Less than a second");
    });

    it("exposes score suitable for a /100 display", () => {
      const result = getPasswordCrackTimeEstimation({ password: "Ab1!" });
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(Math.round(result.score * 100)).toBeGreaterThanOrEqual(0);
    });
  });

  describe("crack duration wording", () => {
    it("matches the it-tools e2e vector", () => {
      expect(getPasswordCrackTimeEstimation({ password: "ABCabc123!@#" }).crackDurationFormatted).toBe(
        "15,091 millennia, 3 centuries",
      );
    });

    it("spells the singular unit correctly", () => {
      const secondsIn1550Years = 31536000000 * 1.55;
      const { crackDurationFormatted } = getPasswordCrackTimeEstimation({
        password: "a",
        guessesPerSecond: 26 / secondsIn1550Years,
      });
      expect(crackDurationFormatted).toBe("1 millennium, 5 centuries");
    });

    it("handles passwords too long for a double without printing Infinity or NaN", () => {
      const estimation = getPasswordCrackTimeEstimation({ password: "a".repeat(300) });
      expect(estimation.crackDurationFormatted).toBe("Effectively forever");
      expect(estimation.score).toBe(1);
    });

    it("counts an emoji as one character", () => {
      expect(getPasswordCrackTimeEstimation({ password: "😀😀" }).passwordLength).toBe(2);
    });
  });
});

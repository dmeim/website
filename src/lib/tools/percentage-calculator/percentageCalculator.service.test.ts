import { describe, expect, it } from "vitest";

import {
  parseOptionalNumber,
  percentOf,
  percentageIncreaseDecrease,
  xIsWhatPercentOfY,
} from "./percentageCalculator.service";

describe("percentage-calculator", () => {
  describe("parseOptionalNumber", () => {
    it("returns undefined for empty or whitespace", () => {
      expect(parseOptionalNumber("")).toBeUndefined();
      expect(parseOptionalNumber("   ")).toBeUndefined();
    });

    it("parses finite numbers", () => {
      expect(parseOptionalNumber("123")).toBe(123);
      expect(parseOptionalNumber("-4.5")).toBe(-4.5);
      expect(parseOptionalNumber("0")).toBe(0);
    });

    it("returns undefined for non-numeric input", () => {
      expect(parseOptionalNumber("abc")).toBeUndefined();
    });
  });

  describe("percentOf", () => {
    it("computes X% of Y (it-tools e2e values)", () => {
      expect(percentOf(123, 456)).toBe("560.88");
    });

    it("returns empty when either input is missing", () => {
      expect(percentOf(123, undefined)).toBe("");
      expect(percentOf(undefined, 456)).toBe("");
      expect(percentOf(undefined, undefined)).toBe("");
    });

    it("handles zero and negatives", () => {
      expect(percentOf(0, 100)).toBe("0");
      expect(percentOf(50, 0)).toBe("0");
      expect(percentOf(10, -200)).toBe("-20");
    });
  });

  describe("xIsWhatPercentOfY", () => {
    it("computes X as percent of Y (it-tools e2e values)", () => {
      expect(xIsWhatPercentOfY(123, 456)).toBe("26.973684210526315");
    });

    it("returns empty when either input is missing", () => {
      expect(xIsWhatPercentOfY(123, undefined)).toBe("");
      expect(xIsWhatPercentOfY(undefined, 456)).toBe("");
    });

    it("returns empty when Y is zero (not finite)", () => {
      expect(xIsWhatPercentOfY(10, 0)).toBe("");
    });

    it("handles exact percentages", () => {
      expect(xIsWhatPercentOfY(25, 100)).toBe("25");
      expect(xIsWhatPercentOfY(50, 200)).toBe("25");
    });
  });

  describe("percentageIncreaseDecrease", () => {
    it("computes percent change (it-tools e2e values)", () => {
      expect(percentageIncreaseDecrease(123, 456)).toBe("270.7317073170732");
    });

    it("returns empty when either input is missing", () => {
      expect(percentageIncreaseDecrease(123, undefined)).toBe("");
      expect(percentageIncreaseDecrease(undefined, 456)).toBe("");
    });

    it("returns empty when from is zero (not finite)", () => {
      expect(percentageIncreaseDecrease(0, 100)).toBe("");
    });

    it("handles decrease and no change", () => {
      expect(percentageIncreaseDecrease(100, 50)).toBe("-50");
      expect(percentageIncreaseDecrease(40, 40)).toBe("0");
    });
  });
});

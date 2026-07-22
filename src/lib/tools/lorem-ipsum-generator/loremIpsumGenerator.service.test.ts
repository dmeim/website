import { describe, expect, it } from "vitest";

import {
  FIRST_SENTENCE,
  clampParagraphCount,
  generateLoremIpsum,
  normalizeInclusiveRange,
  randIntFromInterval,
} from "./loremIpsumGenerator.service";

describe("lorem-ipsum-generator", () => {
  describe("generateLoremIpsum", () => {
    it("starts with the classic first sentence when enabled", () => {
      const text = generateLoremIpsum({
        paragraphCount: 1,
        sentencePerParagraph: 2,
        wordCount: 5,
        startWithLoremIpsum: true,
      });
      expect(text.startsWith(FIRST_SENTENCE)).toBe(true);
    });

    it("does not force the classic sentence when startWithLoremIpsum is false", () => {
      const text = generateLoremIpsum({
        paragraphCount: 1,
        sentencePerParagraph: 1,
        wordCount: 4,
        startWithLoremIpsum: false,
      });
      expect(text.startsWith(FIRST_SENTENCE)).toBe(false);
      expect(text).toMatch(/^[A-Z].*\.$/);
    });

    it("joins paragraphs with a blank line in plain text mode", () => {
      const text = generateLoremIpsum({
        paragraphCount: 3,
        sentencePerParagraph: 1,
        wordCount: 3,
        startWithLoremIpsum: false,
      });
      const parts = text.split("\n\n");
      expect(parts).toHaveLength(3);
      for (const part of parts) {
        expect(part).toMatch(/^[A-Z].*\.$/);
      }
    });

    it("uses the requested sentence and word counts", () => {
      const text = generateLoremIpsum({
        paragraphCount: 1,
        sentencePerParagraph: 4,
        wordCount: 6,
        startWithLoremIpsum: false,
      });
      const sentences = text.match(/[^.]+?\./g) ?? [];
      expect(sentences).toHaveLength(4);
      for (const sentence of sentences) {
        const words = sentence.trim().replace(/\.$/, "").split(/\s+/);
        expect(words).toHaveLength(6);
      }
    });

    it("wraps paragraphs in <p> tags when asHTML is true", () => {
      const html = generateLoremIpsum({
        paragraphCount: 2,
        sentencePerParagraph: 1,
        wordCount: 3,
        startWithLoremIpsum: true,
        asHTML: true,
      });
      expect(html.startsWith("<p>")).toBe(true);
      expect(html.endsWith("</p>")).toBe(true);
      expect(html).toContain("</p>\n\n<p>");
      expect(html).toContain(FIRST_SENTENCE);
    });

    it("returns a single empty paragraph wrapper for zero paragraphs in HTML mode", () => {
      expect(
        generateLoremIpsum({
          paragraphCount: 0,
          sentencePerParagraph: 1,
          wordCount: 3,
          startWithLoremIpsum: true,
          asHTML: true,
        }),
      ).toBe("<p></p>");
    });
  });

  describe("randIntFromInterval", () => {
    it("returns min when the interval collapses", () => {
      expect(randIntFromInterval(5, 5)).toBe(5);
      expect(randIntFromInterval(8, 3)).toBe(8);
    });

    it("stays in the half-open [min, max) range (it-tools parity)", () => {
      for (let i = 0; i < 40; i += 1) {
        const value = randIntFromInterval(3, 8);
        expect(value).toBeGreaterThanOrEqual(3);
        expect(value).toBeLessThan(8);
      }
    });
  });

  describe("clamp helpers", () => {
    it("clamps paragraph count to UI bounds", () => {
      expect(clampParagraphCount(0)).toBe(1);
      expect(clampParagraphCount(99)).toBe(20);
      expect(clampParagraphCount(Number.NaN)).toBe(1);
      expect(clampParagraphCount(7.4)).toBe(7);
    });

    it("normalizes inclusive dual-range sliders", () => {
      expect(normalizeInclusiveRange(10, 4, 1, 50, [3, 8])).toEqual([4, 10]);
      expect(normalizeInclusiveRange(-2, 80, 1, 50, [8, 15])).toEqual([1, 50]);
    });
  });
});

import { describe, expect, it } from "vitest";

import {
  ASCII_FONTS,
  DEFAULT_FONT,
  DEFAULT_INPUT,
  DEFAULT_WIDTH,
  WIDTH_MAX,
  WIDTH_MIN,
  clampWidth,
  normalizeFont,
  renderAsciiText,
  tryRenderAsciiText,
} from "./asciiTextDrawer.service";

describe("ascii-text-drawer", () => {
  describe("clampWidth", () => {
    it("keeps values inside the it-tools bounds", () => {
      expect(clampWidth(80)).toBe(80);
      expect(clampWidth(0)).toBe(0);
      expect(clampWidth(WIDTH_MAX)).toBe(WIDTH_MAX);
    });

    it("clamps out-of-range and non-finite values", () => {
      expect(clampWidth(-5)).toBe(WIDTH_MIN);
      expect(clampWidth(WIDTH_MAX + 1)).toBe(WIDTH_MAX);
      expect(clampWidth(12.9)).toBe(12);
      expect(clampWidth(Number.NaN)).toBe(DEFAULT_WIDTH);
      expect(clampWidth(Number.POSITIVE_INFINITY)).toBe(DEFAULT_WIDTH);
    });
  });

  describe("normalizeFont", () => {
    it("accepts known fonts and falls back to Standard", () => {
      expect(normalizeFont("Doom")).toBe("Doom");
      expect(normalizeFont("Standard")).toBe(DEFAULT_FONT);
      expect(normalizeFont("not-a-font")).toBe(DEFAULT_FONT);
      expect(ASCII_FONTS).toContain(DEFAULT_FONT);
      expect(ASCII_FONTS.length).toBeGreaterThan(200);
    });
  });

  describe("renderAsciiText", () => {
    it("renders the default input with Standard font", async () => {
      const text = await renderAsciiText(DEFAULT_INPUT, {
        font: DEFAULT_FONT,
        width: DEFAULT_WIDTH,
      });

      expect(text).toContain("_");
      expect(text.split("\n").length).toBeGreaterThan(1);
      expect(text.length).toBeGreaterThan(20);
    });

    it("changes output when the font changes", async () => {
      const standard = await renderAsciiText("Hi", {
        font: "Standard",
        width: 80,
      });
      const doom = await renderAsciiText("Hi", { font: "Doom", width: 80 });

      expect(standard).not.toBe(doom);
      expect(doom.length).toBeGreaterThan(0);
    });

    it("returns empty-ish art for empty input without throwing", async () => {
      const text = await renderAsciiText("", { font: "Standard", width: 80 });
      expect(typeof text).toBe("string");
    });
  });

  describe("tryRenderAsciiText", () => {
    it("returns ok for valid settings", async () => {
      const result = await tryRenderAsciiText("OK", {
        font: "Small",
        width: 40,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.text.length).toBeGreaterThan(0);
      }
    });
  });
});

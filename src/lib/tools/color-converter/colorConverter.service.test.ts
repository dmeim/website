import { describe, expect, it } from "vitest";

import {
  applyColorInput,
  formatAll,
  initialColorValues,
  invalidMessageFor,
  isColorInputValid,
  parseColor,
  removeAlphaChannelWhenOpaque,
} from "./colorConverter.service";

describe("color-converter", () => {
  describe("removeAlphaChannelWhenOpaque", () => {
    it("removes alpha channel of an hex color when it is opaque (alpha = 1)", () => {
      expect(removeAlphaChannelWhenOpaque("#000000ff")).toBe("#000000");
      expect(removeAlphaChannelWhenOpaque("#ffffffFF")).toBe("#ffffff");
      expect(removeAlphaChannelWhenOpaque("#000000FE")).toBe("#000000FE");
      expect(removeAlphaChannelWhenOpaque("#00000000")).toBe("#00000000");
    });
  });

  describe("parseColor / isColorInputValid", () => {
    it("parses common formats", () => {
      expect(parseColor("#808000")?.isValid()).toBe(true);
      expect(parseColor("rgb(128, 128, 0)")?.isValid()).toBe(true);
      expect(parseColor("olive")?.isValid()).toBe(true);
      expect(parseColor("not-a-color")).toBeUndefined();
    });

    it("treats empty input as valid", () => {
      expect(isColorInputValid("")).toBe(true);
      expect(isColorInputValid("olive")).toBe(true);
      expect(isColorInputValid("nope")).toBe(false);
    });
  });

  describe("formatAll", () => {
    it("matches it-tools olive conversion outputs", () => {
      const color = parseColor("olive");
      expect(color).toBeDefined();
      const values = formatAll(color!);

      expect(values.hex).toBe("#808000");
      expect(values.rgb).toBe("rgb(128, 128, 0)");
      expect(values.hsl).toBe("hsl(60, 100%, 25%)");
      expect(values.hwb).toBe("hwb(60 0% 50%)");
      expect(values.cmyk).toBe("device-cmyk(0% 0% 100% 50%)");
      expect(values.lch).toBe("lch(52.15% 56.81 99.57)");
      expect(values.name).toBe("olive");
      expect(values.picker).toBe("#808000");
    });
  });

  describe("initialColorValues", () => {
    it("seeds from the it-tools default hex", () => {
      const values = initialColorValues();
      expect(values.hex).toBe("#1ea54c");
      expect(values.rgb).toBe("rgb(30, 165, 76)");
      expect(values.name).toBe("seagreen");
      expect(values.picker).toBe("#1ea54c");
    });
  });

  describe("applyColorInput", () => {
    it("updates sibling formats when the source parses", () => {
      const current = initialColorValues();
      const { values, valid } = applyColorInput(current, "name", "olive");

      expect(valid).toBe(true);
      expect(values.name).toBe("olive");
      expect(values.hex).toBe("#808000");
      expect(values.rgb).toBe("rgb(128, 128, 0)");
      expect(values.hsl).toBe("hsl(60, 100%, 25%)");
    });

    it("keeps the raw source value and leaves siblings alone when invalid", () => {
      const current = initialColorValues();
      const { values, valid } = applyColorInput(current, "hex", "not-hex");

      expect(valid).toBe(false);
      expect(values.hex).toBe("not-hex");
      expect(values.rgb).toBe(current.rgb);
      expect(values.name).toBe(current.name);
    });

    it("allows empty input without rewriting siblings", () => {
      const current = initialColorValues();
      const { values, valid } = applyColorInput(current, "rgb", "");

      expect(valid).toBe(true);
      expect(values.rgb).toBe("");
      expect(values.hex).toBe(current.hex);
    });
  });

  describe("invalidMessageFor", () => {
    it("returns the it-tools style message", () => {
      expect(invalidMessageFor("hex")).toBe("Invalid hex format.");
      expect(invalidMessageFor("picker")).toBe("Invalid color picker format.");
    });
  });
});

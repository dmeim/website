import { describe, expect, it } from "vitest";

import {
  COLOR_FORMATS,
  alphaOf,
  applyColorInput,
  formatAll,
  initialColorValues,
  invalidMessageFor,
  isColorInputValid,
  parseColor,
  previewColor,
  removeAlphaChannelWhenOpaque,
  withAlpha,
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

  describe("alpha and lenient input", () => {
    it("every text placeholder example is a color the tool accepts", () => {
      for (const format of COLOR_FORMATS.filter((item) => item.type === "text")) {
        const example = format.placeholder.replace(/^e\.g\. /, "");
        expect(parseColor(example), format.id).toBeDefined();
      }
    });

    it("carries alpha through every format that has one", () => {
      const { values } = applyColorInput(initialColorValues(), "hex", "#ff000080");
      expect(values.rgb).toBe("rgba(255, 0, 0, 0.5)");
      expect(values.hsl).toBe("hsla(0, 100%, 50%, 0.5)");
      expect(values.hwb).toBe("hwb(0 0% 0% / 0.5)");
      expect(values.picker).toBe("#ff0000");
      expect(alphaOf(values)).toBe(0.5);
    });

    it("accepts a hex without its hash, in the hex field only", () => {
      expect(applyColorInput(initialColorValues(), "hex", "ff0000").values.rgb).toBe("rgb(255, 0, 0)");
      expect(applyColorInput(initialColorValues(), "name", "ff0000").valid).toBe(false);
      expect(isColorInputValid("ff0000", "hex")).toBe(true);
      expect(isColorInputValid("zzz", "hex")).toBe(false);
    });

    it("the picker stays opaque when an alpha is applied to it", () => {
      const hex = withAlpha("#ff0000", 0.5);
      expect(hex).toBe("#ff000080");
      const { values } = applyColorInput(initialColorValues(), "picker", hex);
      expect(values.picker).toBe("#ff0000");
      expect(values.hex).toBe("#ff000080");
    });

    it("round-trips transparent", () => {
      const { values } = applyColorInput(initialColorValues(), "name", "transparent");
      expect(values.hex).toBe("#00000000");
      expect(values.rgb).toBe("rgba(0, 0, 0, 0)");
    });

    it("previews the hex field when it parses and the last good color when not", () => {
      const seeded = applyColorInput(initialColorValues(), "hex", "#ff000080").values;
      expect(previewColor(seeded)).toBe("#ff000080");
      expect(previewColor({ ...seeded, hex: "ff0000" })).toBe("#ff0000");
      expect(previewColor({ ...seeded, hex: "zzz" })).toBe("#ff000080");
      expect(previewColor({ ...seeded, hex: "" })).toBe("#ff000080");
    });
  });

  describe("invalidMessageFor", () => {
    it("returns the it-tools style message", () => {
      expect(invalidMessageFor("hex")).toBe("Invalid hex format.");
      expect(invalidMessageFor("picker")).toBe("Invalid color picker format.");
    });
  });
});

import { describe, expect, it } from "vitest";

import {
  buildDeviceInformation,
  displayValue,
  formatColorDepth,
  formatLanguages,
  formatOrientationAngle,
  formatPixelRatio,
  formatScreenSize,
  formatWindowSize,
  type DeviceEnvironmentSnapshot,
} from "./deviceInformation.service";

const SAMPLE: DeviceEnvironmentSnapshot = {
  screen: {
    availWidth: 1920,
    availHeight: 1080,
    orientationType: "landscape-primary",
    orientationAngle: 0,
    colorDepth: 24,
    devicePixelRatio: 2,
    windowWidth: 1280,
    windowHeight: 720,
  },
  navigator: {
    vendor: "Apple Computer, Inc.",
    languages: ["en-US", "en"],
    platform: "MacIntel",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/605.1.15",
  },
};

describe("device-information", () => {
  describe("formatters", () => {
    it("formats screen and window sizes like it-tools", () => {
      expect(formatScreenSize(1920, 1080)).toBe("1920 x 1080");
      expect(formatWindowSize(1280, 720)).toBe("1280 x 720");
    });

    it("formats orientation angle, color depth, and pixel ratio", () => {
      expect(formatOrientationAngle(0)).toBe("0°");
      expect(formatOrientationAngle(90)).toBe("90°");
      expect(formatColorDepth(24)).toBe("24 bits");
      expect(formatPixelRatio(2)).toBe("2 dppx");
      expect(formatPixelRatio(1.5)).toBe("1.5 dppx");
    });

    it("joins languages", () => {
      expect(formatLanguages(["en-US", "fr"])).toBe("en-US, fr");
      expect(formatLanguages([])).toBe("");
    });
  });

  describe("displayValue", () => {
    it("returns unknown for empty / missing values", () => {
      expect(displayValue(undefined)).toBe("unknown");
      expect(displayValue(null)).toBe("unknown");
      expect(displayValue("")).toBe("unknown");
      expect(displayValue("   ")).toBe("unknown");
    });

    it("preserves non-empty values", () => {
      expect(displayValue("MacIntel")).toBe("MacIntel");
      expect(displayValue(" landscape-primary ")).toBe("landscape-primary");
    });
  });

  describe("buildDeviceInformation", () => {
    it("builds Screen and Device sections matching it-tools fields", () => {
      const sections = buildDeviceInformation(SAMPLE);
      expect(sections.map((s) => s.name)).toEqual(["Screen", "Device"]);

      const screen = sections[0]!.information;
      expect(screen.map((i) => i.label)).toEqual([
        "Screen size",
        "Orientation",
        "Orientation angle",
        "Color depth",
        "Pixel ratio",
        "Window size",
      ]);
      expect(screen.map((i) => i.value)).toEqual([
        "1920 x 1080",
        "landscape-primary",
        "0°",
        "24 bits",
        "2 dppx",
        "1280 x 720",
      ]);

      const device = sections[1]!.information;
      expect(device.map((i) => i.label)).toEqual([
        "Browser vendor",
        "Languages",
        "Platform",
        "User agent",
      ]);
      expect(device.map((i) => i.value)).toEqual([
        "Apple Computer, Inc.",
        "en-US, en",
        "MacIntel",
        SAMPLE.navigator.userAgent,
      ]);
    });

    it("shows unknown when orientation or vendor fields are missing", () => {
      const sections = buildDeviceInformation({
        screen: {
          availWidth: 800,
          availHeight: 600,
          colorDepth: 16,
          devicePixelRatio: 1,
          windowWidth: 800,
          windowHeight: 600,
        },
        navigator: {
          vendor: "",
          languages: [],
          platform: "",
          userAgent: "",
        },
      });

      const byLabel = Object.fromEntries(
        sections.flatMap((s) => s.information.map((i) => [i.label, i.value])),
      );

      expect(byLabel["Orientation"]).toBe("unknown");
      expect(byLabel["Orientation angle"]).toBe("unknown");
      expect(byLabel["Browser vendor"]).toBe("unknown");
      expect(byLabel["Languages"]).toBe("unknown");
      expect(byLabel["Platform"]).toBe("unknown");
      expect(byLabel["User agent"]).toBe("unknown");
      expect(byLabel["Screen size"]).toBe("800 x 600");
    });
  });
});

import { describe, expect, it } from "vitest";

import {
  buildUserAgentSections,
  parseUserAgent,
} from "./userAgentParser.service";

/** Well-known desktop Chrome UA used across it-tools / ua-parser-js docs. */
const CHROME_MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** Mobile Safari on iPhone — exercises device + OS fields. */
const IPHONE_SAFARI_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

describe("user-agent-parser", () => {
  describe("parseUserAgent", () => {
    it("returns empty sections for empty / whitespace input", () => {
      expect(parseUserAgent("")).toEqual({
        ua: "",
        browser: {},
        engine: {},
        os: {},
        device: {},
        cpu: {},
      });
      expect(parseUserAgent("   \n\t  ")).toEqual({
        ua: "",
        browser: {},
        engine: {},
        os: {},
        device: {},
        cpu: {},
      });
    });

    it("parses a desktop Chrome user agent", () => {
      const parsed = parseUserAgent(CHROME_MAC_UA);
      expect(parsed.ua).toBe(CHROME_MAC_UA);
      expect(parsed.browser.name).toBe("Chrome");
      expect(parsed.browser.version).toMatch(/^120/);
      expect(parsed.engine.name).toBe("Blink");
      expect(parsed.os.name).toBe("Mac OS");
      expect(parsed.cpu.architecture).toBeUndefined();
    });

    it("parses an iPhone Safari user agent with device details", () => {
      const parsed = parseUserAgent(IPHONE_SAFARI_UA);
      expect(parsed.browser.name).toBe("Mobile Safari");
      expect(parsed.os.name).toBe("iOS");
      expect(parsed.device.vendor).toBe("Apple");
      expect(parsed.device.model).toBe("iPhone");
      expect(parsed.device.type).toBe("mobile");
      expect(parsed.engine.name).toBe("WebKit");
    });

    it("trims surrounding whitespace before parsing", () => {
      const parsed = parseUserAgent(`  ${CHROME_MAC_UA}  `);
      expect(parsed.browser.name).toBe("Chrome");
      expect(parsed.ua).toBe(CHROME_MAC_UA);
    });
  });

  describe("buildUserAgentSections", () => {
    it("exposes Browser, Engine, OS, Device, CPU headings in order", () => {
      const sections = buildUserAgentSections(parseUserAgent(CHROME_MAC_UA));
      expect(sections.map((s) => s.heading)).toEqual([
        "Browser",
        "Engine",
        "OS",
        "Device",
        "CPU",
      ]);
    });

    it("fills known values and leaves missing fields undefined with fallbacks", () => {
      const sections = buildUserAgentSections(parseUserAgent(CHROME_MAC_UA));
      const browser = sections.find((s) => s.heading === "Browser")!;
      expect(browser.fields[0]).toMatchObject({
        label: "Name",
        value: "Chrome",
      });

      const device = sections.find((s) => s.heading === "Device")!;
      expect(device.fields.find((f) => f.label === "Model")!.value).toBe(
        "Macintosh",
      );
      expect(device.fields.find((f) => f.label === "Vendor")!.value).toBe(
        "Apple",
      );
      expect(device.fields.find((f) => f.label === "Type")).toMatchObject({
        value: undefined,
        fallback: "No device type available",
      });

      const cpu = sections.find((s) => s.heading === "CPU")!;
      expect(cpu.fields[0]).toMatchObject({
        label: "Architecture",
        value: undefined,
        fallback: "No CPU architecture available",
      });
    });

    it("returns all fallbacks for an empty parse result", () => {
      const sections = buildUserAgentSections(parseUserAgent(""));
      for (const section of sections) {
        for (const field of section.fields) {
          expect(field.value).toBeUndefined();
          expect(field.fallback.length).toBeGreaterThan(0);
        }
      }
    });
  });
});

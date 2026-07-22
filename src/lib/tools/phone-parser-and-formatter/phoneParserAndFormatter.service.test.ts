import { describe, expect, it } from "vitest";

import {
  booleanToHumanReadable,
  formatTypeToHumanReadable,
  getCountryOptions,
  getDefaultCountryCode,
  getFullCountryName,
  isValidPhoneInput,
  parsePhone,
} from "./phoneParserAndFormatter.service";

describe("phone-parser-and-formatter", () => {
  describe("isValidPhoneInput", () => {
    it("accepts empty string", () => {
      expect(isValidPhoneInput("")).toBe(true);
    });

    it("accepts digits, spaces, and phone punctuation", () => {
      expect(isValidPhoneInput("+33 6 12-34(56)78")).toBe(true);
      expect(isValidPhoneInput("0612345678")).toBe(true);
    });

    it("rejects letters and other characters", () => {
      expect(isValidPhoneInput("abc")).toBe(false);
      expect(isValidPhoneInput("+33#")).toBe(false);
    });
  });

  describe("formatTypeToHumanReadable", () => {
    it("maps known types", () => {
      expect(formatTypeToHumanReadable("MOBILE")).toBe("Mobile");
      expect(formatTypeToHumanReadable("FIXED_LINE")).toBe("Fixed line");
      expect(formatTypeToHumanReadable("TOLL_FREE")).toBe("Toll free");
    });

    it("returns undefined for nullish type", () => {
      expect(formatTypeToHumanReadable(undefined)).toBeUndefined();
    });
  });

  describe("getFullCountryName", () => {
    it("resolves ISO codes via Intl", () => {
      expect(getFullCountryName("FR")).toMatch(/France/i);
      expect(getFullCountryName("US")).toMatch(/United States/i);
    });

    it("returns undefined for missing code", () => {
      expect(getFullCountryName(undefined)).toBeUndefined();
    });
  });

  describe("getDefaultCountryCode", () => {
    it("extracts region from locale", () => {
      expect(getDefaultCountryCode({ locale: "en-US" })).toBe("US");
      expect(getDefaultCountryCode({ locale: "fr-FR" })).toBe("FR");
    });

    it("falls back when locale has no region", () => {
      expect(getDefaultCountryCode({ locale: "en" })).toBe("FR");
      expect(
        getDefaultCountryCode({ locale: "en", defaultCode: "DE" }),
      ).toBe("DE");
    });

    it("falls back for unsupported region codes", () => {
      expect(getDefaultCountryCode({ locale: "en-ZZ" })).toBe("FR");
    });
  });

  describe("getCountryOptions", () => {
    it("includes common countries with calling codes", () => {
      const options = getCountryOptions();
      expect(options.length).toBeGreaterThan(100);

      const us = options.find((o) => o.code === "US");
      expect(us?.callingCode).toBe("1");
      expect(us?.label).toMatch(/\+1/);

      const fr = options.find((o) => o.code === "FR");
      expect(fr?.callingCode).toBe("33");
    });
  });

  describe("parsePhone", () => {
    it("returns undefined for empty or invalid characters", () => {
      expect(parsePhone("")).toBeUndefined();
      expect(parsePhone("   ")).toBeUndefined();
      expect(parsePhone("not-a-phone", "FR")).toBeUndefined();
    });

    it("parses a French mobile with default country FR", () => {
      const info = parsePhone("0612345678", "FR");
      expect(info).toBeDefined();
      expect(info?.countryCode).toBe("FR");
      expect(info?.countryCallingCode).toBe("33");
      expect(info?.isValid).toBe(true);
      expect(info?.isPossible).toBe(true);
      expect(info?.e164).toBe("+33612345678");
      expect(info?.international).toMatch(/\+33/);
      expect(info?.national).toBeTruthy();
      expect(info?.rfc3966).toMatch(/^tel:/);
      expect(info?.type).toBe("Mobile");
      expect(info?.countryName).toMatch(/France/i);
    });

    it("parses an international US number regardless of default country", () => {
      const info = parsePhone("+1 212 555 1212", "FR");
      expect(info?.countryCode).toBe("US");
      expect(info?.countryCallingCode).toBe("1");
      expect(info?.e164).toBe("+12125551212");
      expect(info?.isPossible).toBe(true);
    });

    it("reports invalid but possible numbers when parseable", () => {
      // Too short for FR mobile but may still parse as a partial national number
      const info = parsePhone("061234", "FR");
      // Either undefined (parse fail) or a result with isValid false
      if (info) {
        expect(info.isValid).toBe(false);
      } else {
        expect(info).toBeUndefined();
      }
    });
  });

  describe("booleanToHumanReadable", () => {
    it("maps booleans to Yes/No", () => {
      expect(booleanToHumanReadable(true)).toBe("Yes");
      expect(booleanToHumanReadable(false)).toBe("No");
    });
  });
});

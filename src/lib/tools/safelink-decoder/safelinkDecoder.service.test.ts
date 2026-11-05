import { describe, expect, it } from "vitest";

import {
  MISSING_URL_MESSAGE,
  NOT_A_SAFELINK_MESSAGE,
  decodeSafeLinksURL,
  decodeSafeLinksURLSafe,
  isSafeLinksUrl,
} from "./safelinkDecoder.service";

const BASIC_SAFELINK =
  "https://aus01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dsafelink%26rlz%3D1&data=05%7C02%7C%7C1ed07253975b46da1d1508dc3443752a%7C84df9e7fe9f640afb435aaaaaaaaaaaa%7C1%7C0%7C638442711583216725%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C0%7C%7C%7C&sdata=%2BQY0HBnnxfI7pzZoxzlhZdDvYu80LwQB0zUUjrffVnk%3D&reserved=0";

const HTML_ENCODED_SAFELINK =
  "https://aus01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dsafelink%26rlz%3D1&amp;data=05%7C02%7C%7C1ed07253975b46da1d1508dc3443752a%7C84df9e7fe9f640afb435aaaaaaaaaaaa%7C1%7C0%7C638442711583216725%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C0%7C%7C%7C&amp;sdata=%2BQY0HBnnxfI7pzZoxzlhZdDvYu80LwQB0zUUjrffVnk%3D&amp;reserved=0";

const DECODED = "https://www.google.com/search?q=safelink&rlz=1";

describe("safelink-decoder", () => {
  describe("isSafeLinksUrl", () => {
    it("accepts Outlook SafeLinks hosts", () => {
      expect(isSafeLinksUrl(BASIC_SAFELINK)).toBe(true);
      expect(
        isSafeLinksUrl("https://nam12.safelinks.protection.outlook.com/?url=https%3A%2F%2Fx.com"),
      ).toBe(true);
    });

    it("rejects non-SafeLinks URLs", () => {
      expect(isSafeLinksUrl("https://google.com")).toBe(false);
      expect(isSafeLinksUrl("")).toBe(false);
    });

    it("checks the host rather than the text of the link", () => {
      expect(isSafeLinksUrl("https://evil.example/?x=.safelinks.protection.outlook.com&url=https%3A%2F%2Fx.com")).toBe(false);
      expect(isSafeLinksUrl("https://nam12.safelinks.protection.outlook.com.evil.example/?url=x")).toBe(false);
    });
  });

  describe("decodeSafeLinksURL", () => {
    it("decodes basic safelink urls", () => {
      expect(decodeSafeLinksURL(BASIC_SAFELINK)).toBe(DECODED);
    });

    it("decodes HTML-entity-encoded safelink urls (&amp; separators)", () => {
      expect(decodeSafeLinksURL(HTML_ENCODED_SAFELINK)).toBe(DECODED);
    });

    it("throws on non-outlook safelink urls", () => {
      expect(() => decodeSafeLinksURL("https://google.com")).toThrow(
        "Invalid SafeLinks URL provided",
      );
    });

    it("reads the url param even when it follows an escaped separator", () => {
      expect(
        decodeSafeLinksURL(
          "https://nam12.safelinks.protection.outlook.com/?data=1&amp;url=https%3A%2F%2Fexample.com%2Fa%3Fb%3D1&amp;reserved=0",
        ),
      ).toBe("https://example.com/a?b=1");
    });

    it("accepts a link copied without its protocol", () => {
      expect(
        decodeSafeLinksURL("eur03.safelinks.protection.outlook.com/?url=https%3A%2F%2Fexample.org"),
      ).toBe("https://example.org");
    });

    it("returns null when url query param is missing", () => {
      expect(
        decodeSafeLinksURL(
          "https://aus01.safelinks.protection.outlook.com/?data=1&reserved=0",
        ),
      ).toBeNull();
    });
  });

  describe("decodeSafeLinksURLSafe", () => {
    it("returns empty success for blank input", () => {
      expect(decodeSafeLinksURLSafe("")).toEqual({ ok: true, url: "" });
      expect(decodeSafeLinksURLSafe("   ")).toEqual({ ok: true, url: "" });
    });

    it("returns decoded url on success", () => {
      expect(decodeSafeLinksURLSafe(BASIC_SAFELINK)).toEqual({
        ok: true,
        url: DECODED,
      });
    });

    it("returns error for non-SafeLinks URLs", () => {
      expect(decodeSafeLinksURLSafe("https://google.com")).toEqual({
        ok: false,
        error: NOT_A_SAFELINK_MESSAGE,
      });
      expect(decodeSafeLinksURLSafe("not a url at all").ok).toBe(false);
    });

    it("returns an error when the SafeLink has no destination", () => {
      expect(
        decodeSafeLinksURLSafe("https://aus01.safelinks.protection.outlook.com/?data=1&reserved=0"),
      ).toEqual({ ok: false, error: MISSING_URL_MESSAGE });
    });
  });
});

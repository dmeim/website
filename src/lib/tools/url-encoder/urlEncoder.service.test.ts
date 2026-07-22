import { describe, expect, it } from "vitest";

import {
  canDecodeUrl,
  canEncodeUrl,
  decodeUrl,
  decodeUrlSafe,
  encodeUrl,
  encodeUrlSafe,
} from "./urlEncoder.service";

describe("url-encoder", () => {
  describe("encodeUrl", () => {
    it("percent-encodes spaces and punctuation", () => {
      expect(encodeUrl("")).toBe("");
      expect(encodeUrl("Hello world :)")).toBe("Hello%20world%20%3A)");
      expect(encodeUrl("a=b&c=d")).toBe("a%3Db%26c%3Dd");
    });

    it("encodes non-ASCII as UTF-8 percent sequences", () => {
      expect(encodeUrl("é")).toBe("%C3%A9");
      expect(encodeUrl("你好")).toBe("%E4%BD%A0%E5%A5%BD");
    });

    it("leaves unreserved characters unchanged", () => {
      expect(encodeUrl("ABC-xyz_123.~")).toBe("ABC-xyz_123.~");
    });
  });

  describe("decodeUrl", () => {
    it("percent-decodes encoded strings", () => {
      expect(decodeUrl("")).toBe("");
      expect(decodeUrl("Hello%20world%20%3A)")).toBe("Hello world :)");
      expect(decodeUrl("a%3Db%26c%3Dd")).toBe("a=b&c=d");
    });

    it("decodes UTF-8 percent sequences", () => {
      expect(decodeUrl("%C3%A9")).toBe("é");
      expect(decodeUrl("%E4%BD%A0%E5%A5%BD")).toBe("你好");
    });

    it("throws on malformed percent-encoding", () => {
      expect(() => decodeUrl("%E0%A4%A")).toThrow(URIError);
      expect(() => decodeUrl("%")).toThrow(URIError);
    });
  });

  describe("safe helpers and validation", () => {
    it("encodeUrlSafe / decodeUrlSafe soft-fail", () => {
      expect(encodeUrlSafe("Hello world :)")).toBe("Hello%20world%20%3A)");
      expect(decodeUrlSafe("Hello%20world%20%3A)")).toBe("Hello world :)");
      expect(decodeUrlSafe("%")).toBe("");
      expect(decodeUrlSafe("%E0%A4%A")).toBe("");
    });

    it("canEncodeUrl / canDecodeUrl report validity", () => {
      expect(canEncodeUrl("anything")).toBe(true);
      expect(canDecodeUrl("Hello%20world")).toBe(true);
      expect(canDecodeUrl("%")).toBe(false);
      expect(canDecodeUrl("%zz")).toBe(false);
    });

    it("round-trips text through encode/decode", () => {
      const sample = "it-tools ← UTF-8 & spaces";
      expect(decodeUrl(encodeUrl(sample))).toBe(sample);
    });
  });
});

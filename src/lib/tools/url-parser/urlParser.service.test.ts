import { describe, expect, it } from "vitest";

import { DEFAULT_URL, isValidUrl, parseUrl } from "./urlParser.service";

describe("url-parser", () => {
  describe("isValidUrl", () => {
    it("accepts absolute URLs", () => {
      expect(isValidUrl(DEFAULT_URL)).toBe(true);
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("http://localhost:8080/path")).toBe(true);
    });

    it("rejects empty, relative, and malformed values", () => {
      expect(isValidUrl("")).toBe(false);
      expect(isValidUrl("not a url")).toBe(false);
      expect(isValidUrl("/relative/path")).toBe(false);
      expect(isValidUrl("example.com")).toBe(false);
    });
  });

  describe("parseUrl", () => {
    it("returns undefined for invalid URLs", () => {
      expect(parseUrl("")).toBeUndefined();
      expect(parseUrl("not a url")).toBeUndefined();
    });

    it("parses the it-tools default sample", () => {
      const parsed = parseUrl(DEFAULT_URL);
      expect(parsed).toBeDefined();
      expect(parsed!.protocol).toBe("https:");
      expect(parsed!.username).toBe("me");
      expect(parsed!.password).toBe("pwd");
      expect(parsed!.hostname).toBe("it-tools.tech");
      expect(parsed!.port).toBe("3000");
      expect(parsed!.pathname).toBe("/url-parser");
      expect(parsed!.search).toBe("?key1=value&key2=value2");
      expect(parsed!.hash).toBe("#the-hash");
      expect(parsed!.origin).toBe("https://it-tools.tech:3000");
    });

    it("exposes labeled properties matching it-tools order", () => {
      const parsed = parseUrl(DEFAULT_URL)!;
      expect(parsed.properties.map((p) => p.key)).toEqual([
        "protocol",
        "username",
        "password",
        "hostname",
        "port",
        "pathname",
        "search",
      ]);
      expect(parsed.properties.map((p) => p.title)).toEqual([
        "Protocol",
        "Username",
        "Password",
        "Hostname",
        "Port",
        "Path",
        "Params",
      ]);
      expect(parsed.properties.find((p) => p.key === "hostname")!.value).toBe(
        "it-tools.tech",
      );
    });

    it("lists search params (last value wins on duplicate keys)", () => {
      const parsed = parseUrl(DEFAULT_URL)!;
      expect(parsed.searchParams).toEqual([
        { key: "key1", value: "value" },
        { key: "key2", value: "value2" },
      ]);

      const dupes = parseUrl(
        "https://example.com/?a=1&b=2&a=3",
      )!.searchParams;
      expect(dupes).toEqual([
        { key: "a", value: "3" },
        { key: "b", value: "2" },
      ]);
    });

    it("returns empty strings for missing optional parts", () => {
      const parsed = parseUrl("https://example.com/path")!;
      expect(parsed.username).toBe("");
      expect(parsed.password).toBe("");
      expect(parsed.port).toBe("");
      expect(parsed.search).toBe("");
      expect(parsed.hash).toBe("");
      expect(parsed.searchParams).toEqual([]);
    });
  });
});

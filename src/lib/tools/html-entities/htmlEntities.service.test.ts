import { describe, expect, it } from "vitest";

import { escapeHtml, unescapeHtml } from "./htmlEntities.service";

describe("html-entities", () => {
  describe("escapeHtml", () => {
    it("escapes the five lodash characters", () => {
      expect(escapeHtml("")).toBe("");
      expect(escapeHtml("<title>IT Tool</title>")).toBe(
        "&lt;title&gt;IT Tool&lt;/title&gt;",
      );
      expect(escapeHtml(`a&b<'>"`)).toBe("a&amp;b&lt;&#39;&gt;&quot;");
    });

    it("leaves safe characters unchanged", () => {
      expect(escapeHtml("Hello world :)")).toBe("Hello world :)");
      expect(escapeHtml("café 你好")).toBe("café 你好");
    });

    it("escapes ampersands before other entities would form", () => {
      expect(escapeHtml("&amp;")).toBe("&amp;amp;");
    });
  });

  describe("unescapeHtml", () => {
    it("unescapes lodash entity set", () => {
      expect(unescapeHtml("")).toBe("");
      expect(unescapeHtml("&lt;title&gt;IT Tool&lt;/title&gt;")).toBe(
        "<title>IT Tool</title>",
      );
      expect(unescapeHtml("&amp;&lt;&gt;&quot;&#39;")).toBe(`&<>"'`);
    });

    it("leaves unrecognized entities and plain text alone", () => {
      expect(unescapeHtml("Hello world :)")).toBe("Hello world :)");
      expect(unescapeHtml("&nbsp; &#96; &#x27;")).toBe("&nbsp; &#96; &#x27;");
    });
  });

  describe("round-trip", () => {
    it("round-trips text containing special characters", () => {
      const sample = `<script>alert("x") & 'y'</script>`;
      expect(unescapeHtml(escapeHtml(sample))).toBe(sample);
    });
  });
});

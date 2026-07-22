import { describe, expect, it } from "vitest";

import {
  DEFAULT_HTML,
  HTML_WYSIWYG_STORAGE_KEY,
  formatEditorHtml,
  formatHtml,
  normalizeEditorHtml,
  readStoredHtml,
  writeStoredHtml,
} from "./htmlWysiwygEditor.service";

describe("html-wysiwyg-editor", () => {
  describe("normalizeEditorHtml", () => {
    it("returns empty for blank and TipTap empty doc", () => {
      expect(normalizeEditorHtml("")).toBe("");
      expect(normalizeEditorHtml("   ")).toBe("");
      expect(normalizeEditorHtml("<p></p>")).toBe("");
    });

    it("trims surrounding whitespace", () => {
      expect(normalizeEditorHtml("  <p>Hi</p>  ")).toBe("<p>Hi</p>");
    });
  });

  describe("formatHtml", () => {
    it("returns empty for blank input", () => {
      expect(formatHtml("")).toBe("");
      expect(formatHtml("   ")).toBe("");
    });

    it("pretty-prints the default document", () => {
      expect(formatHtml(DEFAULT_HTML)).toBe(
        [
          "<h1>",
          "  Hey!",
          "</h1>",
          "<p>",
          "  Welcome to this html wysiwyg editor",
          "</p>",
        ].join("\n"),
      );
    });

    it("indents nested lists", () => {
      const input = "<ul><li><p>One</p></li><li><p>Two</p></li></ul>";
      expect(formatHtml(input)).toBe(
        [
          "<ul>",
          "  <li>",
          "    <p>",
          "      One",
          "    </p>",
          "  </li>",
          "  <li>",
          "    <p>",
          "      Two",
          "    </p>",
          "  </li>",
          "</ul>",
        ].join("\n"),
      );
    });

    it("keeps inline marks with paragraph text", () => {
      expect(formatHtml("<p>Hello <strong>world</strong></p>")).toBe(
        ["<p>", "  Hello <strong>world</strong>", "</p>"].join("\n"),
      );
    });

    it("formats headings, code blocks, and blockquotes", () => {
      const input =
        "<h2>Title</h2><pre><code>const x = 1</code></pre><blockquote><p>Quote</p></blockquote>";
      expect(formatHtml(input)).toBe(
        [
          "<h2>",
          "  Title",
          "</h2>",
          "<pre>",
          "  <code>const x = 1</code>",
          "</pre>",
          "<blockquote>",
          "  <p>",
          "    Quote",
          "  </p>",
          "</blockquote>",
        ].join("\n"),
      );
    });
  });

  describe("formatEditorHtml", () => {
    it("normalizes then formats", () => {
      expect(formatEditorHtml("<p></p>")).toBe("");
      expect(formatEditorHtml(`  ${DEFAULT_HTML}  `)).toBe(
        formatHtml(DEFAULT_HTML),
      );
    });
  });

  describe("storage helpers", () => {
    it("reads default when storage is missing or empty", () => {
      expect(readStoredHtml(null)).toBe(DEFAULT_HTML);
      const store = new Map<string, string>();
      const storage = {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
      };
      expect(readStoredHtml(storage)).toBe(DEFAULT_HTML);
    });

    it("round-trips persisted HTML", () => {
      const store = new Map<string, string>();
      const storage = {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
      };
      writeStoredHtml("<p>Saved</p>", storage);
      expect(store.get(HTML_WYSIWYG_STORAGE_KEY)).toBe("<p>Saved</p>");
      expect(readStoredHtml(storage)).toBe("<p>Saved</p>");
    });

    it("swallows storage errors", () => {
      const broken = {
        getItem: () => {
          throw new Error("denied");
        },
        setItem: () => {
          throw new Error("denied");
        },
      };
      expect(readStoredHtml(broken)).toBe(DEFAULT_HTML);
      expect(() => writeStoredHtml("<p>x</p>", broken)).not.toThrow();
    });
  });
});

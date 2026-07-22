import { describe, expect, it } from "vitest";

import { markdownToHtml } from "./markdownToHtml.service";

describe("markdown-to-html", () => {
  describe("markdownToHtml", () => {
    it("returns empty string for empty input", () => {
      expect(markdownToHtml("")).toBe("");
    });

    it("renders a paragraph", () => {
      expect(markdownToHtml("Hello world")).toBe("<p>Hello world</p>\n");
    });

    it("renders headings", () => {
      expect(markdownToHtml("# Title")).toBe("<h1>Title</h1>\n");
      expect(markdownToHtml("## Subtitle")).toBe("<h2>Subtitle</h2>\n");
    });

    it("renders emphasis and strong", () => {
      expect(markdownToHtml("*italic* and **bold**")).toBe(
        "<p><em>italic</em> and <strong>bold</strong></p>\n",
      );
    });

    it("renders links", () => {
      expect(markdownToHtml("[dmeim](https://dmeim.com)")).toBe(
        '<p><a href="https://dmeim.com">dmeim</a></p>\n',
      );
    });

    it("renders fenced code blocks", () => {
      const html = markdownToHtml("```\nconst x = 1;\n```");
      expect(html).toContain("<pre>");
      expect(html).toContain("<code>");
      expect(html).toContain("const x = 1;");
    });

    it("renders unordered lists", () => {
      const html = markdownToHtml("- one\n- two");
      expect(html).toContain("<ul>");
      expect(html).toContain("<li>one</li>");
      expect(html).toContain("<li>two</li>");
    });

    it("renders inline code", () => {
      expect(markdownToHtml("Use `code` here")).toBe(
        "<p>Use <code>code</code> here</p>\n",
      );
    });
  });
});

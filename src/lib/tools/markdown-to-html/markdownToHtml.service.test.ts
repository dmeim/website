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

    it("escapes raw HTML, so the preview cannot run markup from the input", () => {
      expect(markdownToHtml("<script>alert(1)</script>")).toBe(
        "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>\n",
      );
      expect(markdownToHtml('<img src=x onerror="alert(1)">')).not.toContain("<img");
    });

    it("does not link dangerous URL schemes", () => {
      for (const url of ["javascript:alert(1)", "vbscript:msgbox(1)", "data:text/html;base64,PHNjcmlwdD4="]) {
        expect(markdownToHtml(`[click](${url})`), url).not.toContain("<a ");
        expect(markdownToHtml(`![pic](${url})`), url).not.toContain("<img");
      }
    });

    it("renders inline code", () => {
      expect(markdownToHtml("Use `code` here")).toBe(
        "<p>Use <code>code</code> here</p>\n",
      );
    });
  });
});

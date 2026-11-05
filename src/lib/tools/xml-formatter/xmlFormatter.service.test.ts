import { describe, expect, it } from "vitest";

import {
  DEFAULT_INDENT_SIZE,
  clampIndentSize,
  formatXml,
  isValidXml,
} from "./xmlFormatter.service";

describe("xml-formatter", () => {
  describe("clampIndentSize", () => {
    it("clamps to 0–10 and truncates", () => {
      expect(clampIndentSize(-1)).toBe(0);
      expect(clampIndentSize(0)).toBe(0);
      expect(clampIndentSize(2.9)).toBe(2);
      expect(clampIndentSize(10)).toBe(10);
      expect(clampIndentSize(99)).toBe(10);
      expect(clampIndentSize(Number.NaN)).toBe(DEFAULT_INDENT_SIZE);
    });
  });

  describe("formatXml", () => {
    it("converts XML into a human readable format with collapseContent", () => {
      const initString = "<hello><world>foo</world><world>bar</world></hello>";

      expect(
        formatXml({
          rawXml: initString,
          indentSize: 4,
          collapseContent: false,
        }),
      ).toBe(`<hello>
    <world>
        foo
    </world>
    <world>
        bar
    </world>
</hello>`);
    });

    it("collapses simple text content when collapseContent is true", () => {
      expect(
        formatXml({
          rawXml: "<hello><world>foo</world><world>bar</world></hello>",
          indentSize: 2,
          collapseContent: true,
        }),
      ).toBe(`<hello>
  <world>foo</world>
  <world>bar</world>
</hello>`);
    });

    it("trims surrounding whitespace before formatting", () => {
      expect(
        formatXml({
          rawXml: "  <a><b>x</b></a>  ",
          indentSize: 2,
          collapseContent: true,
        }),
      ).toBe(`<a>
  <b>x</b>
</a>`);
    });

    it("supports indent 0", () => {
      expect(
        formatXml({
          rawXml: "<a><b>x</b></a>",
          indentSize: 0,
          collapseContent: true,
        }),
      ).toBe(`<a>
<b>x</b>
</a>`);
    });

    it("returns empty string for empty or non-XML input", () => {
      expect(formatXml({ rawXml: "" })).toBe("");
      expect(formatXml({ rawXml: "   " })).toBe("");
      expect(formatXml({ rawXml: "hello world" })).toBe("");
    });

    it("does not rewrite broken markup into different XML", () => {
      for (const rawXml of ["<unclosed>", "<a><b></a>", "<a></b>", "<a"]) {
        expect(formatXml({ rawXml }), rawXml).toBe("");
      }
    });

    it("keeps declarations, comments, CDATA, namespaces, entities, and unicode", () => {
      expect(
        formatXml({
          rawXml: `<?xml version="1.0"?><!DOCTYPE r><r xmlns:x="u"><!-- c --><x:a b="1">é😀 &amp; more</x:a><c><![CDATA[1<2]]></c><d/></r>`,
          indentSize: 2,
          collapseContent: true,
        }),
      ).toBe(`<?xml version="1.0"?>
<!DOCTYPE r>
<r xmlns:x="u">
  <!-- c -->
  <x:a b="1">é😀 &amp; more</x:a>
  <c><![CDATA[1<2]]></c>
  <d/>
</r>`);
    });
  });

  describe("isValidXml", () => {
    it("accepts empty and parseable XML", () => {
      expect(isValidXml("")).toBe(true);
      expect(isValidXml("   ")).toBe(true);
      expect(isValidXml("<a/>")).toBe(true);
      expect(isValidXml("<hello><world>foo</world></hello>")).toBe(true);
    });

    it("rejects non-XML text, broken markup, and multiple roots", () => {
      expect(isValidXml("hello world")).toBe(false);
      expect(isValidXml("<unclosed>")).toBe(false);
      expect(isValidXml("<a><b></a>")).toBe(false);
      expect(isValidXml("<a/><b/>")).toBe(false);
    });
  });
});

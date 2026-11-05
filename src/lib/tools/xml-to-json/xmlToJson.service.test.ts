import { describe, expect, it } from "vitest";

import { isValidXml, xmlToJson } from "./xmlToJson.service";
import { DEFAULT_XML } from "./xmlToJson.service";

describe("xml-to-json", () => {
  describe("xmlToJson", () => {
    it("converts compact attribute element to json with 2-space indent", () => {
      const input = `<a x="1.234" y="It's"/>`;
      expect(xmlToJson(input)).toBe(
        `{
  "a": {
    "_attributes": {
      "x": "1.234",
      "y": "It's"
    }
  }
}`,
      );
    });

    it("converts nested elements with text nodes", () => {
      const input = "<root><child>text</child></root>";
      expect(xmlToJson(input)).toBe(
        `{
  "root": {
    "child": {
      "_text": "text"
    }
  }
}`,
      );
    });

    it("returns nothing for empty / whitespace input", () => {
      expect(xmlToJson("")).toBe("");
      expect(xmlToJson("   ")).toBe("");
    });

    it("matches the it-tools default sample", () => {
      expect(xmlToJson(DEFAULT_XML)).toBe(
        JSON.stringify({ a: { _attributes: { x: "1.234", y: "It's" } } }, null, 2),
      );
    });

    it("decodes entities and keeps emoji", () => {
      expect(JSON.parse(xmlToJson('<a x="1&amp;2">a &amp; b &#x1F600; é</a>'))).toEqual({
        a: { _attributes: { x: "1&2" }, _text: "a & b 😀 é" },
      });
    });

    it("tolerates whitespace before a declaration", () => {
      expect(isValidXml('  <?xml version="1.0"?><a/>')).toBe(true);
      expect(JSON.parse(xmlToJson('  <?xml version="1.0"?><a/>'))).toEqual({
        _declaration: { _attributes: { version: "1.0" } },
        a: {},
      });
    });

    it("rejects a second root, like it-tools", () => {
      expect(isValidXml("<a/><b/>")).toBe(false);
    });

    it("returns empty string for invalid xml", () => {
      expect(xmlToJson("not xml")).toBe("");
      expect(xmlToJson("<unclosed>")).toBe("");
    });
  });

  describe("isValidXml", () => {
    it("accepts empty / whitespace and well-formed xml", () => {
      expect(isValidXml("")).toBe(true);
      expect(isValidXml("   ")).toBe(true);
      expect(isValidXml(`<a x="1"/>`)).toBe(true);
      expect(isValidXml("<root><child>ok</child></root>")).toBe(true);
    });

    it("rejects invalid xml", () => {
      expect(isValidXml("not xml")).toBe(false);
      expect(isValidXml("<unclosed>")).toBe(false);
    });
  });
});

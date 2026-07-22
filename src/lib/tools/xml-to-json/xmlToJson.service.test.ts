import { describe, expect, it } from "vitest";

import { isValidXml, xmlToJson } from "./xmlToJson.service";

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

    it("returns empty object json for empty / whitespace input", () => {
      expect(xmlToJson("")).toBe("{}");
      expect(xmlToJson("   ")).toBe("{}");
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

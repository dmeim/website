import { describe, expect, it } from "vitest";

import { isValidJson, jsonToXml } from "./jsonToXml.service";

describe("json-to-xml", () => {
  describe("jsonToXml", () => {
    it("converts compact attribute object to xml", () => {
      const input = `{"a":{"_attributes":{"x":"1.234","y":"It's"}}}`;
      expect(jsonToXml(input)).toBe(`<a x="1.234" y="It's"/>`);
    });

    it("converts nested elements with text nodes", () => {
      const input = `{"root":{"child":{"_text":"text"}}}`;
      expect(jsonToXml(input)).toBe("<root><child>text</child></root>");
    });

    it("accepts JSON5 (unquoted keys, trailing commas)", () => {
      const input = `{a: {_attributes: {x: "1",},},}`;
      expect(jsonToXml(input)).toBe(`<a x="1"/>`);
    });

    it("returns empty string for empty object", () => {
      expect(jsonToXml("{}")).toBe("");
    });

    it("returns empty string for empty / invalid input", () => {
      expect(jsonToXml("")).toBe("");
      expect(jsonToXml("   ")).toBe("");
      expect(jsonToXml("{unterminated")).toBe("");
      expect(jsonToXml("not json")).toBe("");
    });
  });

  describe("isValidJson", () => {
    it("accepts empty and valid json / json5", () => {
      expect(isValidJson("")).toBe(true);
      expect(isValidJson('{"a":1}')).toBe(true);
      expect(isValidJson("{a: 1}")).toBe(true);
      expect(isValidJson(`{"a":{"_attributes":{"x":"1"}}}`)).toBe(true);
    });

    it("rejects invalid json", () => {
      expect(isValidJson("{unterminated")).toBe(false);
      expect(isValidJson("[1, 2")).toBe(false);
      expect(isValidJson("not json")).toBe(false);
      expect(isValidJson("   ")).toBe(false);
    });
  });
});

import { describe, expect, it } from "vitest";

import { isValidJson, jsonToXml } from "./jsonToXml.service";
import { DEFAULT_JSON, getJsonToXmlError } from "./jsonToXml.service";

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

    it("matches the it-tools default sample", () => {
      expect(jsonToXml(DEFAULT_JSON)).toBe(`<a x="1.234" y="It's"/>`);
    });

    it("escapes attributes and text into well-formed XML", () => {
      expect(jsonToXml('{"a":{"_attributes":{"x":"<&\\"y"},"_text":"<&>"}}')).toBe(
        '<a x="&lt;&amp;&quot;y">&lt;&amp;&gt;</a>',
      );
      expect(getJsonToXmlError('{"a":{"_attributes":{"x":"<&"}}}')).toBeNull();
    });

    it("explains why a shape cannot become XML, and shows no broken output", () => {
      expect(getJsonToXmlError("  ")).toBeNull();
      expect(getJsonToXmlError("{nope")).toBe("Provided JSON is not valid.");
      for (const value of ["[1, 2]", '"ab"', "42", "null"]) {
        expect(getJsonToXmlError(value), value).toContain("top level");
        expect(jsonToXml(value), value).toBe("");
      }
      expect(getJsonToXmlError('{"a b": 1}')).toContain("XML name");
      expect(jsonToXml('{"a b": 1}')).toBe("");
      expect(getJsonToXmlError('{"1a": 1}')).toContain("XML name");
    });

    it("rejects invalid json", () => {
      expect(isValidJson("{unterminated")).toBe(false);
      expect(isValidJson("[1, 2")).toBe(false);
      expect(isValidJson("not json")).toBe(false);
      expect(isValidJson("   ")).toBe(true);
    });
  });
});

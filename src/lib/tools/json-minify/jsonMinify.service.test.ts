import { describe, expect, it } from "vitest";

import { DEFAULT_RAW_JSON, isValidJson, minifyJson } from "./jsonMinify.service";

describe("json-minify", () => {
  describe("minifyJson", () => {
    it("minifies the default sample", () => {
      expect(minifyJson(DEFAULT_RAW_JSON)).toBe('{"hello":["world"]}');
    });

    it("strips whitespace from pretty JSON", () => {
      expect(
        minifyJson('{\n  "a": 1,\n  "b": [2, 3]\n}'),
      ).toBe('{"a":1,"b":[2,3]}');
    });

    it("accepts JSON5 (unquoted keys, trailing commas)", () => {
      expect(minifyJson("{hello: 'world', foo: 'bar',}")).toBe(
        '{"hello":"world","foo":"bar"}',
      );
    });

    it("preserves key order from input", () => {
      expect(minifyJson('{"hello": "world", "foo": "bar"}')).toBe(
        '{"hello":"world","foo":"bar"}',
      );
    });

    it("returns empty string for empty or invalid input", () => {
      expect(minifyJson("")).toBe("");
      expect(minifyJson("{unterminated")).toBe("");
      expect(minifyJson("not json")).toBe("");
    });
  });

  describe("isValidJson", () => {
    it("accepts empty and valid json / json5", () => {
      expect(isValidJson("")).toBe(true);
      expect(isValidJson('{"a":1}')).toBe(true);
      expect(isValidJson("{a: 1}")).toBe(true);
      expect(isValidJson("[1, 2, 3]")).toBe(true);
      expect(isValidJson(DEFAULT_RAW_JSON)).toBe(true);
    });

    it("rejects invalid json", () => {
      expect(isValidJson("{unterminated")).toBe(false);
      expect(isValidJson("[1, 2")).toBe(false);
      expect(isValidJson("not json")).toBe(false);
    });
  });
});

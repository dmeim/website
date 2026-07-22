import { describe, expect, it } from "vitest";

import { isValidJson, jsonToYaml } from "./jsonToYamlConverter.service";

describe("json-to-yaml-converter", () => {
  describe("jsonToYaml", () => {
    it("parses json and outputs clean yaml", () => {
      const input = '{"foo":"bar","list":["item",{"key":"value"}]}';
      expect(jsonToYaml(input).trim()).toBe(
        "foo: bar\nlist:\n  - item\n  - key: value".trim(),
      );
    });

    it("accepts JSON5 (unquoted keys, trailing commas)", () => {
      const input = "{foo: 'bar', list: [1, 2,],}";
      expect(jsonToYaml(input).trim()).toBe("foo: bar\nlist:\n  - 1\n  - 2".trim());
    });

    it("returns empty string for empty input", () => {
      expect(jsonToYaml("")).toBe("");
    });

    it("returns empty string for invalid json", () => {
      expect(jsonToYaml("{unterminated")).toBe("");
      expect(jsonToYaml("[1, 2")).toBe("");
      expect(jsonToYaml("not json")).toBe("");
    });

    it("stringifies scalars and null", () => {
      expect(jsonToYaml("true").trim()).toBe("true");
      expect(jsonToYaml("42").trim()).toBe("42");
      expect(jsonToYaml('"hello"').trim()).toBe("hello");
      expect(jsonToYaml("null").trim()).toBe("null");
    });

    it("stringifies empty object and array", () => {
      expect(jsonToYaml("{}").trim()).toBe("{}");
      expect(jsonToYaml("[]").trim()).toBe("[]");
    });
  });

  describe("isValidJson", () => {
    it("accepts empty and valid json / json5", () => {
      expect(isValidJson("")).toBe(true);
      expect(isValidJson('{"a":1}')).toBe(true);
      expect(isValidJson("{a: 1}")).toBe(true);
      expect(isValidJson("[1, 2, 3]")).toBe(true);
    });

    it("rejects invalid json", () => {
      expect(isValidJson("{unterminated")).toBe(false);
      expect(isValidJson("[1, 2")).toBe(false);
      expect(isValidJson("not json")).toBe(false);
    });
  });
});

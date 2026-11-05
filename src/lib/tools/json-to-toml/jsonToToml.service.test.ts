import { describe, expect, it } from "vitest";

import { isValidJson, jsonToToml } from "./jsonToToml.service";
import { getJsonToTomlError } from "./jsonToToml.service";

describe("json-to-toml", () => {
  describe("jsonToToml", () => {
    it("parses json and outputs clean toml", () => {
      const input = `
{
   "foo": "bar",
   "list": {
      "name": "item",
      "another": {
         "key": "value"
      }
   }
}
      `.trim();

      expect(jsonToToml(input)).toBe(
        `
foo = "bar"

[list]
name = "item"

  [list.another]
  key = "value"
        `.trim(),
      );
    });

    it("accepts JSON5 (unquoted keys, trailing commas)", () => {
      const input = "{foo: 'bar', nested: {key: 1,},}";
      expect(jsonToToml(input)).toBe(
        `
foo = "bar"

[nested]
key = 1
        `.trim(),
      );
    });

    it("returns empty string for empty or whitespace input", () => {
      expect(jsonToToml("")).toBe("");
      expect(jsonToToml("   \n  ")).toBe("");
    });

    it("returns empty string for invalid json", () => {
      expect(jsonToToml("{unterminated")).toBe("");
      expect(jsonToToml("[1, 2")).toBe("");
      expect(jsonToToml("not json")).toBe("");
    });

    it("stringifies empty object", () => {
      expect(jsonToToml("{}")).toBe("");
    });

    it("returns empty string for top-level array (not a TOML document)", () => {
      expect(jsonToToml("[1, 2, 3]")).toBe("");
    });
  });

  describe("isValidJson", () => {
    it("accepts empty and valid json / json5", () => {
      expect(isValidJson("")).toBe(true);
      expect(isValidJson('{"a":1}')).toBe(true);
      expect(isValidJson("{a: 1}")).toBe(true);
      expect(isValidJson("[1, 2, 3]")).toBe(true);
    });

    it("explains what stopped the conversion", () => {
      expect(getJsonToTomlError("  ")).toBeNull();
      expect(getJsonToTomlError("{a: 1}")).toBeNull();
      expect(getJsonToTomlError("{nope")).toBe("Provided JSON is not valid.");
      for (const value of ["[1, 2]", "42", '"text"', "null", "false"]) {
        expect(getJsonToTomlError(value), value).toContain("top level");
      }
    });

    it("rejects invalid json", () => {
      expect(isValidJson("{unterminated")).toBe(false);
      expect(isValidJson("[1, 2")).toBe(false);
      expect(isValidJson("not json")).toBe(false);
    });
  });
});

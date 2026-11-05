import { describe, expect, it } from "vitest";

import { isValidYaml, yamlToJson } from "./yamlToJsonConverter.service";
import { getYamlToJsonError } from "./yamlToJsonConverter.service";

describe("yaml-to-json-converter", () => {
  describe("yamlToJson", () => {
    it("parses yaml and outputs clean json with 3-space indent", () => {
      const input = "foo: bar\nlist:\n  - item\n  - key: value";
      expect(yamlToJson(input)).toBe(
        `{
   "foo": "bar",
   "list": [
      "item",
      {
         "key": "value"
      }
   ]
}`,
      );
    });

    it("parses yaml with merge keys", () => {
      const input = `
      default: &default
        name: ''
        age: 0

      person:
        *default

      persons:
      - <<: *default
        age: 1
      - <<: *default
        name: John
      - { age: 3, <<: *default }
      
      `;

      expect(yamlToJson(input)).toBe(
        `{
   "default": {
      "name": "",
      "age": 0
   },
   "person": {
      "name": "",
      "age": 0
   },
   "persons": [
      {
         "name": "",
         "age": 1
      },
      {
         "name": "John",
         "age": 0
      },
      {
         "age": 3,
         "name": ""
      }
   ]
}`,
      );
    });

    it("returns empty string for empty / null yaml documents", () => {
      expect(yamlToJson("")).toBe("");
      expect(yamlToJson("~")).toBe("");
      expect(yamlToJson("null")).toBe("");
    });

    it("returns empty string for invalid yaml", () => {
      expect(yamlToJson("[unterminated")).toBe("");
      expect(yamlToJson("foo: [1, 2")).toBe("");
      expect(yamlToJson("{a: b, c")).toBe("");
    });

    it("converts falsy scalars rather than showing nothing", () => {
      expect(yamlToJson("false")).toBe("false");
      expect(yamlToJson("0")).toBe("0");
      expect(yamlToJson('""')).toBe('""');
    });

    it("explains what stopped the conversion", () => {
      expect(getYamlToJsonError("")).toBeNull();
      expect(getYamlToJsonError("   ")).toBeNull();
      expect(getYamlToJsonError("a: 1")).toBeNull();
      expect(getYamlToJsonError("a: b: c")).toBe("Provided YAML is not valid.");
      expect(getYamlToJsonError("a: &a\n  b: *a")).toContain("refers to itself");
    });

    it("stringifies truthy scalars", () => {
      expect(yamlToJson("true")).toBe("true");
      expect(yamlToJson("42")).toBe("42");
      expect(yamlToJson("hello")).toBe('"hello"');
    });
  });

  describe("isValidYaml", () => {
    it("accepts valid yaml", () => {
      expect(isValidYaml("")).toBe(true);
      expect(isValidYaml("foo: bar")).toBe(true);
      expect(isValidYaml("- a\n- b")).toBe(true);
    });

    it("rejects invalid yaml", () => {
      expect(isValidYaml("[unterminated")).toBe(false);
      expect(isValidYaml("foo: [1, 2")).toBe(false);
      expect(isValidYaml("{a: b, c")).toBe(false);
    });
  });
});

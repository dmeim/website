import { describe, expect, it } from "vitest";

import { isValidYaml, yamlToToml } from "./yamlToToml.service";

describe("yaml-to-toml", () => {
  describe("yamlToToml", () => {
    it("parses yaml and outputs clean toml", () => {
      const input = `
foo: bar
list:
  name: item
  another:
    key: value
    number: 1
      `.trim();

      expect(yamlToToml(input)).toBe(
        `
foo = "bar"

[list]
name = "item"

  [list.another]
  key = "value"
  number = 1
        `.trim(),
      );
    });

    it("returns empty string for empty or whitespace input", () => {
      expect(yamlToToml("")).toBe("");
      expect(yamlToToml("   \n  ")).toBe("");
    });

    it("returns empty string for invalid yaml", () => {
      expect(yamlToToml("[unterminated")).toBe("");
      expect(yamlToToml("foo: [1, 2")).toBe("");
      expect(yamlToToml("{a: b, c")).toBe("");
    });

    it("stringifies empty object", () => {
      expect(yamlToToml("{}")).toBe("");
    });

    it("returns empty string for top-level array (not a TOML document)", () => {
      expect(yamlToToml("- a\n- b")).toBe("");
    });
  });

  describe("isValidYaml", () => {
    it("accepts empty and valid yaml", () => {
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

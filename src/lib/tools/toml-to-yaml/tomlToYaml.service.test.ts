import { describe, expect, it } from "vitest";

import { isValidToml, tomlToYaml } from "./tomlToYaml.service";

describe("toml-to-yaml", () => {
  describe("tomlToYaml", () => {
    it("parses toml and outputs clean yaml", () => {
      const input = `
foo = "bar"

# This is a comment

[list]
  name = "item"
[list.another]
  key = "value"
    `.trim();

      expect(tomlToYaml(input).trim()).toBe(
        `
foo: bar
list:
  name: item
  another:
    key: value
      `.trim(),
      );
    });

    it("returns empty string for empty or whitespace input", () => {
      expect(tomlToYaml("")).toBe("");
      expect(tomlToYaml("   \n\t  ")).toBe("");
    });

    it("returns empty string for invalid toml", () => {
      expect(tomlToYaml("foo = [unterminated")).toBe("");
      expect(tomlToYaml("[section\nkey = 1")).toBe("");
      expect(tomlToYaml("= value")).toBe("");
    });

    it("stringifies empty table", () => {
      expect(tomlToYaml("# just a comment").trim()).toBe("{}");
    });

    it("stringifies nested tables and arrays", () => {
      const input = `
title = "demo"

[owner]
name = "Tom"

[[products]]
name = "Hammer"
sku = 1

[[products]]
name = "Nail"
sku = 2
      `.trim();

      expect(tomlToYaml(input).trim()).toBe(
        `
title: demo
owner:
  name: Tom
products:
  - name: Hammer
    sku: 1
  - name: Nail
    sku: 2
      `.trim(),
      );
    });
  });

  describe("isValidToml", () => {
    it("accepts valid toml", () => {
      expect(isValidToml('foo = "bar"')).toBe(true);
      expect(isValidToml("[section]\nkey = 1")).toBe(true);
      expect(isValidToml("# comment only")).toBe(true);
    });

    it("rejects invalid toml", () => {
      expect(isValidToml("foo = [unterminated")).toBe(false);
      expect(isValidToml("[section\nkey = 1")).toBe(false);
      expect(isValidToml("= value")).toBe(false);
    });
  });
});

import { describe, expect, it } from "vitest";

import { isValidToml, tomlToJson } from "./tomlToJson.service";

describe("toml-to-json", () => {
  describe("tomlToJson", () => {
    it("parses toml and outputs clean json with 3-space indent", () => {
      const input = `
foo = "bar"

# This is a comment

[list]
  name = "item"
[list.another]
  key = "value"
    `.trim();

      expect(tomlToJson(input)).toBe(
        `{
   "foo": "bar",
   "list": {
      "name": "item",
      "another": {
         "key": "value"
      }
   }
}`,
      );
    });

    it("returns empty string for empty input", () => {
      expect(tomlToJson("")).toBe("");
    });

    it("keeps integers above 2^53 exact", () => {
      expect(tomlToJson("a = 9007199254740993\nb = [-9007199254740993]")).toBe(
        '{\n   "a": 9007199254740993,\n   "b": [\n      -9007199254740993\n   ]\n}',
      );
    });

    it("converts every TOML date flavor to a string", () => {
      const parsed = JSON.parse(
        tomlToJson("offset = 1979-05-27T07:32:00Z\nlocal = 1979-05-27T07:32:00\nday = 1979-05-27\ntime = 07:32:00"),
      ) as Record<string, string>;
      expect(parsed.offset).toBe("1979-05-27T07:32:00.000Z");
      expect(parsed.local).toBe("1979-05-27T07:32:00.000");
      expect(parsed.day).toBe("1979-05-27");
      expect(parsed.time).toBe("07:32:00.000");
    });

    it("treats whitespace as empty", () => {
      expect(tomlToJson(" \n ")).toBe("");
    });

    it("returns empty string for invalid toml", () => {
      expect(tomlToJson("foo = [unterminated")).toBe("");
      expect(tomlToJson("[section\nkey = 1")).toBe("");
      expect(tomlToJson("= value")).toBe("");
    });

    it("stringifies empty table", () => {
      expect(tomlToJson("# just a comment")).toBe("{}");
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

      expect(tomlToJson(input)).toBe(
        `{
   "title": "demo",
   "owner": {
      "name": "Tom"
   },
   "products": [
      {
         "name": "Hammer",
         "sku": 1
      },
      {
         "name": "Nail",
         "sku": 2
      }
   ]
}`,
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

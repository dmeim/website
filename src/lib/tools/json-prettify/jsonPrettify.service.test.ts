import { describe, expect, it } from "vitest";

import {
  DEFAULT_INDENT_SIZE,
  clampIndentSize,
  formatJson,
  isValidJson,
  sortObjectKeys,
} from "./jsonPrettify.service";

describe("json-prettify", () => {
  describe("sortObjectKeys", () => {
    it("recursively sorts object keys alphabetically", () => {
      expect(JSON.stringify(sortObjectKeys({ b: 2, a: 1 }))).toEqual(
        JSON.stringify({ a: 1, b: 2 }),
      );
      expect(JSON.stringify(sortObjectKeys({ b: 2, a: 1 }))).not.toEqual(
        JSON.stringify({ b: 2, a: 1 }),
      );

      expect(
        JSON.stringify(
          sortObjectKeys({ b: 2, a: 1, d: { j: 7, a: [{ z: 9, y: 8 }] }, c: 3 }),
        ),
      ).toEqual(
        JSON.stringify({ a: 1, b: 2, c: 3, d: { a: [{ y: 8, z: 9 }], j: 7 } }),
      );
    });

    it("leaves primitives and null unchanged", () => {
      expect(sortObjectKeys(null)).toBe(null);
      expect(sortObjectKeys(42)).toBe(42);
      expect(sortObjectKeys("x")).toBe("x");
    });
  });

  describe("clampIndentSize", () => {
    it("clamps to 0–10 and truncates", () => {
      expect(clampIndentSize(-1)).toBe(0);
      expect(clampIndentSize(0)).toBe(0);
      expect(clampIndentSize(3.9)).toBe(3);
      expect(clampIndentSize(10)).toBe(10);
      expect(clampIndentSize(99)).toBe(10);
      expect(clampIndentSize(Number.NaN)).toBe(DEFAULT_INDENT_SIZE);
    });
  });

  describe("formatJson", () => {
    it("prettifies with default indent and sorted keys", () => {
      expect(
        formatJson({ rawJson: '{"hello": "world", "foo": "bar"}' }),
      ).toBe('{\n   "foo": "bar",\n   "hello": "world"\n}');
    });

    it("preserves key order when sortKeys is false", () => {
      expect(
        formatJson({
          rawJson: '{"hello": "world", "foo": "bar"}',
          sortKeys: false,
          indentSize: 2,
        }),
      ).toBe('{\n  "hello": "world",\n  "foo": "bar"\n}');
    });

    it("accepts JSON5 (unquoted keys, trailing commas)", () => {
      expect(
        formatJson({
          rawJson: "{hello: 'world', foo: 'bar',}",
          sortKeys: true,
          indentSize: 2,
        }),
      ).toBe('{\n  "foo": "bar",\n  "hello": "world"\n}');
    });

    it("supports indent 0 (compact but still stringify spacing)", () => {
      expect(
        formatJson({
          rawJson: '{"a":1,"b":2}',
          sortKeys: false,
          indentSize: 0,
        }),
      ).toBe('{"a":1,"b":2}');
    });

    it("returns empty string for empty or invalid input", () => {
      expect(formatJson({ rawJson: "" })).toBe("");
      expect(formatJson({ rawJson: "{unterminated" })).toBe("");
      expect(formatJson({ rawJson: "not json" })).toBe("");
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

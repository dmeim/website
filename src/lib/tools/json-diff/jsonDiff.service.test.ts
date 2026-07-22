import { describe, expect, it } from "vitest";

import {
  areDeepEqual,
  diff,
  formatDiffValue,
  isValidJsonInput,
  parseJsonInput,
} from "./jsonDiff.service";

describe("json-diff", () => {
  describe("diff", () => {
    it("list object differences", () => {
      const obj = { a: 1, b: 2 };
      const newObj = { a: 1, b: 2, c: 3 };
      const result = diff(obj, newObj);

      expect(result).toEqual({
        key: "",
        type: "object",
        children: [
          {
            key: "a",
            type: "value",
            value: 1,
            oldValue: 1,
            status: "unchanged",
          },
          {
            key: "b",
            type: "value",
            value: 2,
            oldValue: 2,
            status: "unchanged",
          },
          {
            key: "c",
            type: "value",
            value: 3,
            oldValue: undefined,
            status: "added",
          },
        ],
        oldValue: { a: 1, b: 2 },
        value: { a: 1, b: 2, c: 3 },
        status: "children-updated",
      });
    });

    it("list array differences", () => {
      const obj = [1, 2];
      const newObj = [1, 2, 3];
      const result = diff(obj, newObj);

      expect(result).toEqual({
        key: "",
        type: "array",
        children: [
          {
            key: 0,
            type: "value",
            value: 1,
            oldValue: 1,
            status: "unchanged",
          },
          {
            key: 1,
            type: "value",
            value: 2,
            oldValue: 2,
            status: "unchanged",
          },
          {
            key: 2,
            type: "value",
            value: 3,
            oldValue: undefined,
            status: "added",
          },
        ],
        oldValue: [1, 2],
        value: [1, 2, 3],
        status: "children-updated",
      });
    });

    it("marks updated scalar values", () => {
      const result = diff({ a: 1 }, { a: 2 });
      expect(result.children?.[0]).toMatchObject({
        key: "a",
        status: "updated",
        oldValue: 1,
        value: 2,
      });
    });

    it("marks removed keys", () => {
      const result = diff({ a: 1, b: 2 }, { a: 1 });
      expect(result.children?.find((c) => c.key === "b")).toMatchObject({
        status: "removed",
        oldValue: 2,
        value: undefined,
      });
    });

    it("filters unchanged when onlyShowDifferences is true", () => {
      const result = diff({ a: 1, b: 2 }, { a: 1, b: 3, c: 4 }, {
        onlyShowDifferences: true,
      });
      expect(result.children?.map((c) => c.key)).toEqual(["b", "c"]);
    });

    it("returns unchanged for identical roots", () => {
      expect(diff({ a: 1 }, { a: 1 }).status).toBe("unchanged");
      expect(diff([1, 2], [1, 2]).status).toBe("unchanged");
      expect(diff("x", "x").status).toBe("unchanged");
    });
  });

  describe("parse / validate", () => {
    it("accepts empty and valid JSON5", () => {
      expect(isValidJsonInput("")).toBe(true);
      expect(isValidJsonInput('{"a":1}')).toBe(true);
      expect(isValidJsonInput("{a: 1,}")).toBe(true);
      expect(isValidJsonInput("[1, 2,]")).toBe(true);
    });

    it("rejects invalid JSON", () => {
      expect(isValidJsonInput("{unterminated")).toBe(false);
      expect(isValidJsonInput("not json")).toBe(false);
    });

    it("parseJsonInput returns undefined for empty or invalid", () => {
      expect(parseJsonInput("")).toBeUndefined();
      expect(parseJsonInput("{bad")).toBeUndefined();
      expect(parseJsonInput("{a: 1}")).toEqual({ a: 1 });
    });
  });

  describe("helpers", () => {
    it("areDeepEqual compares nested structures", () => {
      expect(areDeepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
      expect(areDeepEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(areDeepEqual([1], { 0: 1 })).toBe(false);
    });

    it("formatDiffValue stringifies like it-tools", () => {
      expect(formatDiffValue(null)).toBe("null");
      expect(formatDiffValue("hi")).toBe('"hi"');
      expect(formatDiffValue({ a: 1 })).toBe('{"a":1}');
    });
  });
});

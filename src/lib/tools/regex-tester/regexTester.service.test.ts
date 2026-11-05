import { describe, expect, it } from "vitest";

import {
  DEFAULT_FLAG_OPTIONS,
  buildRegexFlags,
  generateSample,
  getRegexValidationError,
  isValidRegex,
  MAX_MATCHES,
  matchRegex,
  runRegex,
  safeMatchRegex,
} from "./regexTester.service";

const regexesData = [
  {
    regex: "",
    text: "",
    flags: "",
    result: [],
  },
  {
    regex: ".*",
    text: "",
    flags: "",
    result: [],
  },
  {
    regex: "",
    text: "aaa",
    flags: "",
    result: [],
  },
  {
    regex: "a",
    text: "baaa",
    flags: "",
    result: [
      {
        captures: [],
        groups: [],
        index: 1,
        value: "a",
      },
    ],
  },
  {
    regex: "(.)(?<g>r)",
    text: "azertyr",
    flags: "g",
    result: [
      {
        captures: [
          {
            end: 3,
            name: "1",
            start: 2,
            value: "e",
          },
          {
            end: 4,
            name: "2",
            start: 3,
            value: "r",
          },
        ],
        groups: [
          {
            end: 4,
            name: "g",
            start: 3,
            value: "r",
          },
        ],
        index: 2,
        value: "er",
      },
      {
        captures: [
          {
            end: 6,
            name: "1",
            start: 5,
            value: "y",
          },
          {
            end: 7,
            name: "2",
            start: 6,
            value: "r",
          },
        ],
        groups: [
          {
            end: 7,
            name: "g",
            start: 6,
            value: "r",
          },
        ],
        index: 5,
        value: "yr",
      },
    ],
  },
];

describe("regex-tester", () => {
  describe("matchRegex", () => {
    for (const reg of regexesData) {
      const { regex, text, flags, result: expected } = reg;
      it(`matchRegex("${regex}","${text}","${flags}") returns correct result`, () => {
        const result = matchRegex(regex, text, `${flags}d`);
        expect(result).toEqual(expected);
      });
    }

    it("respects ignoreCase flag", () => {
      expect(matchRegex("a", "A", "di")).toEqual([
        { index: 0, value: "A", captures: [], groups: [] },
      ]);
    });

    it("respects multiline ^/$", () => {
      expect(matchRegex("^b", "a\nb", "dm")).toEqual([
        { index: 2, value: "b", captures: [], groups: [] },
      ]);
    });

    it("respects dotAll so . matches newlines", () => {
      expect(matchRegex("a.b", "a\nb", "ds")).toEqual([
        { index: 0, value: "a\nb", captures: [], groups: [] },
      ]);
    });

    it("lists a group that did not take part in the match instead of failing", () => {
      expect(matchRegex("(a)|(b)|(?<n>c)", "b", "dg")).toEqual([
        {
          index: 0,
          value: "b",
          captures: [
            { name: "1", value: null, start: null, end: null },
            { name: "2", value: "b", start: 0, end: 1 },
            { name: "3", value: null, start: null, end: null },
          ],
          groups: [{ name: "n", value: null, start: null, end: null }],
        },
      ]);
    });

    it("moves past zero-length matches to find the real ones", () => {
      expect(matchRegex("a*", "baaa", "dg")).toEqual([{ index: 1, value: "aaa", captures: [], groups: [] }]);
    });

    it("steps over a whole code point after a zero-length match in unicode mode", () => {
      expect(matchRegex("x*", "😀x", "dgu")).toEqual([{ index: 2, value: "x", captures: [], groups: [] }]);
    });

    it("reports UTF-16 offsets for emoji", () => {
      expect(matchRegex(".", "😀a", "dgu").map(({ index, value }) => [index, value])).toEqual([
        [0, "😀"],
        [2, "a"],
      ]);
      expect(matchRegex(".", "😀", "dg")).toHaveLength(2);
    });

    it("returns one match without g, even with y", () => {
      expect(matchRegex("a", "aaa", "d")).toHaveLength(1);
      expect(matchRegex("a", "aaa", "dy")).toHaveLength(1);
    });

    it("anchors sticky matches at the start and at each previous match", () => {
      expect(matchRegex("a", "baa", "dy")).toEqual([]);
      expect(matchRegex("a", "baa", "dgy")).toEqual([]);
      expect(matchRegex("a", "aab a", "dgy").map(({ index }) => index)).toEqual([0, 1]);
    });

    it("respects multiline with global", () => {
      expect(matchRegex("^\\w", "ab\ncd", "dgm").map(({ value }) => value)).toEqual(["a", "c"]);
      expect(matchRegex("^\\w", "ab\ncd", "dg").map(({ value }) => value)).toEqual(["a"]);
    });

    it("supports set notation with v", () => {
      expect(matchRegex("[\\p{L}--[a-z]]", "aB", "dgv").map(({ value }) => value)).toEqual(["B"]);
    });

    it("stops at the limit", () => {
      expect(matchRegex("a", "aaaa", "dg", 2)).toHaveLength(2);
    });

    it("finds all global matches", () => {
      expect(matchRegex("a", "aba", "dg")).toEqual([
        { index: 0, value: "a", captures: [], groups: [] },
        { index: 2, value: "a", captures: [], groups: [] },
      ]);
    });
  });

  describe("buildRegexFlags", () => {
    it("matches it-tools defaults (d + g + s + u)", () => {
      expect(buildRegexFlags(DEFAULT_FLAG_OPTIONS)).toBe("dgsu");
    });

    it("includes i/m when enabled", () => {
      expect(
        buildRegexFlags({
          ...DEFAULT_FLAG_OPTIONS,
          ignoreCase: true,
          multiline: true,
        }),
      ).toBe("dgimsu");
    });

    it("uses v when unicode is off and unicodeSets is on", () => {
      expect(
        buildRegexFlags({
          ...DEFAULT_FLAG_OPTIONS,
          unicode: false,
          unicodeSets: true,
        }),
      ).toBe("dgsv");
    });

    it("prefers u over v when both are on", () => {
      expect(
        buildRegexFlags({
          ...DEFAULT_FLAG_OPTIONS,
          unicode: true,
          unicodeSets: true,
        }),
      ).toBe("dgsu");
    });

    it("adds y for sticky", () => {
      expect(buildRegexFlags({ ...DEFAULT_FLAG_OPTIONS, sticky: true })).toBe("dgsuy");
    });

    it("omits g when global is false", () => {
      expect(
        buildRegexFlags({
          ...DEFAULT_FLAG_OPTIONS,
          global: false,
        }),
      ).toBe("dsu");
    });
  });

  describe("validation", () => {
    it("accepts empty and simple patterns", () => {
      expect(isValidRegex("")).toBe(true);
      expect(isValidRegex("a+")).toBe(true);
      expect(getRegexValidationError("a+")).toBeNull();
    });

    it("rejects unclosed groups", () => {
      expect(isValidRegex("(a")).toBe(false);
      expect(getRegexValidationError("(a")).toMatch(/Invalid|Unterminated/i);
    });

    it("validates against the flags in use", () => {
      expect(isValidRegex("\\-")).toBe(true);
      expect(isValidRegex("\\-", "u")).toBe(false);
      expect(isValidRegex("[a&&b]", "v")).toBe(true);
      expect(isValidRegex("a{1", "u")).toBe(false);
    });
  });

  describe("safeMatchRegex", () => {
    it("returns [] for invalid patterns instead of throwing", () => {
      expect(safeMatchRegex("(a", "aaa", "dg")).toEqual([]);
    });
  });

  describe("runRegex", () => {
    it("returns matches and a sample", () => {
      const { matches, sample } = runRegex({ regex: "[0-9]{3}", text: "a123", flags: "dg" });
      expect(matches).toEqual([{ index: 1, value: "123", captures: [], groups: [] }]);
      expect(sample).toMatch(/^[0-9]{3}$/);
    });

    it("caps the number of matches", () => {
      expect(runRegex({ regex: "a", text: "a".repeat(MAX_MATCHES + 5), flags: "dg" }).matches).toHaveLength(MAX_MATCHES);
    });

    it("returns no matches for a pattern the flags reject", () => {
      expect(runRegex({ regex: "\\-", text: "-", flags: "du" }).matches).toEqual([]);
    });
  });

  describe("generateSample", () => {
    it("does not mistake a lookbehind for a named group", () => {
      expect(generateSample("(?<x>y)")).toBe("y");
      expect(generateSample("(?<=a)b(?<x>y)")).toBe("");
    });

    it("returns empty string for invalid patterns", () => {
      expect(generateSample("(a")).toBe("");
    });

    it("returns a string that matches a simple pattern", () => {
      const sample = generateSample("ab+c");
      expect(sample).toMatch(/^ab+c$/);
    });

    it("handles named groups by rewriting to non-capturing", () => {
      const sample = generateSample("(?<word>\\w+)");
      expect(sample).toMatch(/^\w+$/);
    });
  });
});

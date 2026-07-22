import { describe, expect, it } from "vitest";

import {
  DEFAULT_FLAG_OPTIONS,
  buildRegexFlags,
  generateSample,
  getRegexValidationError,
  isValidRegex,
  matchRegex,
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
  });

  describe("safeMatchRegex", () => {
    it("returns [] for invalid patterns instead of throwing", () => {
      expect(safeMatchRegex("(a", "aaa", "dg")).toEqual([]);
    });
  });

  describe("generateSample", () => {
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

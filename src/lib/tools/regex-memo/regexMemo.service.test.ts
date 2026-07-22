import { describe, expect, it } from "vitest";

import {
  regexMemoReferences,
  regexMemoSections,
} from "./regexMemo.data";
import {
  countRegexMemoEntries,
  countRegexMemoSections,
  filterRegexMemoSections,
  findRegexMemoEntryByExpression,
  flattenRegexMemoEntries,
  primaryRegexExpression,
  slugifyRegexMemoTitle,
} from "./regexMemo.service";

describe("regex-memo", () => {
  describe("data table", () => {
    it("includes the source sections in order", () => {
      expect(regexMemoSections.map((section) => section.title)).toEqual([
        "Normal characters",
        "Whitespace characters",
        "Character set",
        "Outside a character set",
        "Inside a character set",
        "Quantifiers",
        "Boundaries",
        "Matching",
        "Grouping and capturing",
      ]);
    });

    it("keeps escaping subsections under the shared group", () => {
      const escaping = regexMemoSections.filter(
        (section) => section.group === "Characters that require escaping",
      );
      expect(escaping).toHaveLength(2);
      expect(escaping.map((section) => section.title)).toEqual([
        "Outside a character set",
        "Inside a character set",
      ]);
    });

    it("counts sections and entries consistently", () => {
      const flat = flattenRegexMemoEntries();
      expect(countRegexMemoSections()).toBe(9);
      expect(countRegexMemoEntries()).toBe(flat.length);
      expect(flat.length).toBe(50);
      expect(flat.every((entry) => entry.section.length > 0)).toBe(true);
      expect(flat.every((entry) => entry.expression.length > 0)).toBe(true);
      expect(flat.every((entry) => entry.description.length > 0)).toBe(true);
    });

    it("preserves key expressions from the source memo", () => {
      expect(findRegexMemoEntryByExpression("\\d or [0-9]")?.description).toBe(
        "digit",
      );
      expect(findRegexMemoEntryByExpression("(?<=bar)foo")?.section).toBe(
        "Matching",
      );
      expect(findRegexMemoEntryByExpression("(foo)bar\\1")?.section).toBe(
        "Grouping and capturing",
      );
      expect(findRegexMemoEntryByExpression("\\\\")?.group).toBe(
        "Characters that require escaping",
      );
    });

    it("includes references to MDN and RegExplained", () => {
      expect(regexMemoReferences.map((ref) => ref.label)).toEqual([
        "MDN",
        "RegExplained",
      ]);
      expect(regexMemoReferences.every((ref) => ref.href.startsWith("http"))).toBe(
        true,
      );
    });
  });

  describe("filterRegexMemoSections", () => {
    it("returns all sections when the query is blank", () => {
      expect(filterRegexMemoSections("")).toBe(regexMemoSections);
      expect(filterRegexMemoSections("   ")).toBe(regexMemoSections);
    });

    it("collapses matches into a Search results group", () => {
      const result = filterRegexMemoSections("(?=");
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Search results");
      expect(result[0].entries.length).toBeGreaterThanOrEqual(1);
      expect(
        result[0].entries.every((entry) =>
          entry.expression.toLowerCase().includes("(?="),
        ),
      ).toBe(true);
    });

    it("matches by section title", () => {
      const result = filterRegexMemoSections("quantifiers");
      expect(result[0].entries).toHaveLength(6);
      expect(result[0].entries.map((entry) => entry.expression)).toEqual([
        "{2}",
        "{2,}",
        "{2,7}",
        "*",
        "+",
        "?",
      ]);
    });

    it("matches by group title", () => {
      const result = filterRegexMemoSections("require escaping");
      expect(result[0].entries.length).toBe(14);
    });

    it("matches by description text", () => {
      const result = filterRegexMemoSections("non-digit");
      expect(result[0].entries).toHaveLength(1);
      expect(result[0].entries[0].expression).toBe("\\D or [^0-9]");
    });

    it("matches by note text", () => {
      const result = filterRegexMemoSections("negate");
      expect(result[0].entries.length).toBe(4);
      expect(
        result[0].entries.every((entry) =>
          ["[xyz]", "[^xyz]", "[1-3]", "[^1-3]"].includes(entry.expression),
        ),
      ).toBe(true);
    });

    it("returns an empty Search results group when nothing matches", () => {
      expect(filterRegexMemoSections("zzzz-no-such-regex")).toEqual([
        { title: "Search results", entries: [] },
      ]);
    });
  });

  describe("slugifyRegexMemoTitle", () => {
    it("slugifies section titles for ids", () => {
      expect(slugifyRegexMemoTitle("Normal characters")).toBe(
        "normal-characters",
      );
      expect(slugifyRegexMemoTitle("Grouping and capturing")).toBe(
        "grouping-and-capturing",
      );
    });
  });

  describe("primaryRegexExpression", () => {
    it("returns the first alternative when expression lists or-options", () => {
      expect(primaryRegexExpression(". or [^\\n\\r]")).toBe(".");
      expect(primaryRegexExpression("\\d or [0-9]")).toBe("\\d");
      expect(primaryRegexExpression("\\w")).toBe("\\w");
    });
  });
});

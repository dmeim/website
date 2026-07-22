import { describe, expect, it } from "vitest";

import {
  DEFAULT_INDENT_STYLE,
  DEFAULT_KEYWORD_CASE,
  DEFAULT_LANGUAGE,
  DEFAULT_RAW_SQL,
  formatSql,
  normalizeDialect,
  normalizeIndentStyle,
  normalizeKeywordCase,
  tryFormatSql,
} from "./sqlPrettify.service";

describe("sql-prettify", () => {
  describe("normalize helpers", () => {
    it("accepts known dialect / keyword case / indent style values", () => {
      expect(normalizeDialect("postgresql")).toBe("postgresql");
      expect(normalizeKeywordCase("lower")).toBe("lower");
      expect(normalizeIndentStyle("tabularLeft")).toBe("tabularLeft");
    });

    it("falls back to defaults for unknown values", () => {
      expect(normalizeDialect("nope")).toBe(DEFAULT_LANGUAGE);
      expect(normalizeKeywordCase("NOPE")).toBe(DEFAULT_KEYWORD_CASE);
      expect(normalizeIndentStyle("weird")).toBe(DEFAULT_INDENT_STYLE);
    });
  });

  describe("formatSql", () => {
    it("prettifies the default sample with uppercase keywords", () => {
      expect(formatSql({ rawSql: DEFAULT_RAW_SQL })).toBe(
        [
          "SELECT",
          "  field1,",
          "  field2,",
          "  field3",
          "FROM",
          "  my_table",
          "WHERE",
          "  my_condition;",
        ].join("\n"),
      );
    });

    it("lowercases keywords when requested", () => {
      expect(
        formatSql({
          rawSql: "SELECT id FROM users;",
          keywordCase: "lower",
        }),
      ).toBe("select\n  id\nfrom\n  users;");
    });

    it("preserves keyword case when requested", () => {
      expect(
        formatSql({
          rawSql: "Select id From users;",
          keywordCase: "preserve",
        }),
      ).toBe("Select\n  id\nFrom\n  users;");
    });

    it("applies tabularLeft indent style", () => {
      const formatted = formatSql({
        rawSql: "select a, b from t;",
        indentStyle: "tabularLeft",
      });
      expect(formatted).toContain("SELECT");
      expect(formatted).toContain("FROM");
      expect(formatted.split("\n").length).toBeGreaterThan(1);
    });

    it("formats with a non-default dialect", () => {
      expect(
        formatSql({
          rawSql: "select 1;",
          language: "postgresql",
        }),
      ).toBe("SELECT\n  1;");
    });

    it("returns empty string for empty input", () => {
      expect(formatSql({ rawSql: "" })).toBe("");
    });

    it("returns empty string when the formatter rejects input", () => {
      expect(formatSql({ rawSql: "not sql !!!" })).toBe("");
    });
  });

  describe("tryFormatSql", () => {
    it("returns ok with formatted SQL", () => {
      const result = tryFormatSql({ rawSql: "select 1;" });
      expect(result).toEqual({ ok: true, sql: "SELECT\n  1;" });
    });

    it("returns error details on parse failure", () => {
      const result = tryFormatSql({ rawSql: "not sql !!!" });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toMatch(/Parse error|Unexpected/i);
      }
    });
  });
});

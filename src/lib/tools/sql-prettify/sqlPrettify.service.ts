/**
 * SQL prettify / format.
 * Parity with it-tools sql-prettify: sql-formatter with dialect, keyword case, indent style.
 */
import { format as formatSQL, type SqlLanguage } from "sql-formatter";

export type SqlDialect = SqlLanguage;
export type SqlKeywordCase = "upper" | "lower" | "preserve";
export type SqlIndentStyle = "standard" | "tabularLeft" | "tabularRight";

export const DEFAULT_RAW_SQL =
  "select field1,field2,field3 from my_table where my_condition;";
export const DEFAULT_LANGUAGE: SqlDialect = "sql";
export const DEFAULT_KEYWORD_CASE: SqlKeywordCase = "upper";
export const DEFAULT_INDENT_STYLE: SqlIndentStyle = "standard";

/** Hardcoded in it-tools (not exposed in UI). */
export const DEFAULT_USE_TABS = false;
export const DEFAULT_TABULATE_ALIAS = true;

export const SQL_DIALECT_OPTIONS: ReadonlyArray<{
  label: string;
  value: SqlDialect;
}> = [
  { label: "GCP BigQuery", value: "bigquery" },
  { label: "IBM DB2", value: "db2" },
  { label: "Apache Hive", value: "hive" },
  { label: "MariaDB", value: "mariadb" },
  { label: "MySQL", value: "mysql" },
  { label: "Couchbase N1QL", value: "n1ql" },
  { label: "Oracle PL/SQL", value: "plsql" },
  { label: "PostgreSQL", value: "postgresql" },
  { label: "Amazon Redshift", value: "redshift" },
  { label: "Spark", value: "spark" },
  { label: "Standard SQL", value: "sql" },
  { label: "sqlite", value: "sqlite" },
  { label: "SQL Server Transact-SQL", value: "tsql" },
];

export const SQL_KEYWORD_CASE_OPTIONS: ReadonlyArray<{
  label: string;
  value: SqlKeywordCase;
}> = [
  { label: "UPPERCASE", value: "upper" },
  { label: "lowercase", value: "lower" },
  { label: "Preserve", value: "preserve" },
];

export const SQL_INDENT_STYLE_OPTIONS: ReadonlyArray<{
  label: string;
  value: SqlIndentStyle;
}> = [
  { label: "Standard", value: "standard" },
  { label: "Tabular left", value: "tabularLeft" },
  { label: "Tabular right", value: "tabularRight" },
];

const DIALECT_VALUES = new Set(
  SQL_DIALECT_OPTIONS.map((option) => option.value),
);
const KEYWORD_CASE_VALUES = new Set(
  SQL_KEYWORD_CASE_OPTIONS.map((option) => option.value),
);
const INDENT_STYLE_VALUES = new Set(
  SQL_INDENT_STYLE_OPTIONS.map((option) => option.value),
);

export function normalizeDialect(value: string): SqlDialect {
  return DIALECT_VALUES.has(value as SqlDialect)
    ? (value as SqlDialect)
    : DEFAULT_LANGUAGE;
}

export function normalizeKeywordCase(value: string): SqlKeywordCase {
  return KEYWORD_CASE_VALUES.has(value as SqlKeywordCase)
    ? (value as SqlKeywordCase)
    : DEFAULT_KEYWORD_CASE;
}

export function normalizeIndentStyle(value: string): SqlIndentStyle {
  return INDENT_STYLE_VALUES.has(value as SqlIndentStyle)
    ? (value as SqlIndentStyle)
    : DEFAULT_INDENT_STYLE;
}

export type SqlFormatOptions = {
  rawSql: string;
  language?: SqlDialect;
  keywordCase?: SqlKeywordCase;
  indentStyle?: SqlIndentStyle;
};

export type SqlFormatResult =
  | { ok: true; sql: string }
  | { ok: false; error: string };

/**
 * Format SQL with it-tools defaults (spaces, tabulateAlias).
 * Returns "" on parse failure (sql-formatter throws on some invalid input).
 */
export function formatSql({
  rawSql,
  language = DEFAULT_LANGUAGE,
  keywordCase = DEFAULT_KEYWORD_CASE,
  indentStyle = DEFAULT_INDENT_STYLE,
}: SqlFormatOptions): string {
  const result = tryFormatSql({ rawSql, language, keywordCase, indentStyle });
  return result.ok ? result.sql : "";
}

/** Same as formatSql but surfaces the formatter error message. */
export function tryFormatSql({
  rawSql,
  language = DEFAULT_LANGUAGE,
  keywordCase = DEFAULT_KEYWORD_CASE,
  indentStyle = DEFAULT_INDENT_STYLE,
}: SqlFormatOptions): SqlFormatResult {
  try {
    const sql = formatSQL(rawSql, {
      language: normalizeDialect(language),
      keywordCase: normalizeKeywordCase(keywordCase),
      indentStyle: normalizeIndentStyle(indentStyle),
      useTabs: DEFAULT_USE_TABS,
      tabulateAlias: DEFAULT_TABULATE_ALIAS,
    });
    return { ok: true, sql };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not format SQL.";
    return { ok: false, error: message };
  }
}

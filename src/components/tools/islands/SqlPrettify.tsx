import { useMemo, useState } from "react";

import { FormGrid, Panel, Select, ToolFrame, TransformPanel } from "@/ui/react";
import {
  DEFAULT_INDENT_STYLE,
  DEFAULT_KEYWORD_CASE,
  DEFAULT_LANGUAGE,
  DEFAULT_RAW_SQL,
  SQL_DIALECT_OPTIONS,
  SQL_INDENT_STYLE_OPTIONS,
  SQL_KEYWORD_CASE_OPTIONS,
  normalizeDialect,
  normalizeIndentStyle,
  normalizeKeywordCase,
  tryFormatSql,
  type SqlDialect,
  type SqlIndentStyle,
  type SqlKeywordCase,
} from "@/lib/tools/sql-prettify";

export default function SqlPrettify() {
  const [rawSql, setRawSql] = useState(DEFAULT_RAW_SQL);
  const [language, setLanguage] = useState<SqlDialect>(DEFAULT_LANGUAGE);
  const [keywordCase, setKeywordCase] =
    useState<SqlKeywordCase>(DEFAULT_KEYWORD_CASE);
  const [indentStyle, setIndentStyle] =
    useState<SqlIndentStyle>(DEFAULT_INDENT_STYLE);

  const formatResult = useMemo(
    () => tryFormatSql({ rawSql, language, keywordCase, indentStyle }),
    [rawSql, language, keywordCase, indentStyle],
  );

  const prettified = formatResult.ok ? formatResult.sql : "";
  const formatError =
    !formatResult.ok && rawSql.trim() !== "" ? formatResult.error : undefined;

  return (
    <ToolFrame>
      <Panel
        title="SQL prettify"
        description="Paste a SQL query to format it. Choose dialect, keyword case, and indent style."
      >
        <TransformPanel
          input={{
            label: "Your SQL query",
            value: rawSql,
            onChange: setRawSql,
            placeholder: "Put your SQL query here…",
            mono: true,
            rows: 12,
          }}
          output={{ label: "Prettify version of your query", value: prettified, mono: true, rows: 12 }}
          error={formatError}
          options={
            <FormGrid columns={3}>
              <Select
                id="sp-dialect"
                label="Dialect"
                value={language}
                onChange={(event) => setLanguage(normalizeDialect(event.target.value))}
                options={[...SQL_DIALECT_OPTIONS]}
              />
              <Select
                id="sp-keyword-case"
                label="Keyword case"
                value={keywordCase}
                onChange={(event) => setKeywordCase(normalizeKeywordCase(event.target.value))}
                options={[...SQL_KEYWORD_CASE_OPTIONS]}
              />
              <Select
                id="sp-indent-style"
                label="Indent style"
                value={indentStyle}
                onChange={(event) => setIndentStyle(normalizeIndentStyle(event.target.value))}
                options={[...SQL_INDENT_STYLE_OPTIONS]}
              />
            </FormGrid>
          }
        />
      </Panel>
    </ToolFrame>
  );
}

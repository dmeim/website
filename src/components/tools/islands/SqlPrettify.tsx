import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolFormGrid,
  ToolHint,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolSelect,
  ToolStatus,
  ToolTextarea,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
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

import "./SqlPrettify.css";

export default function SqlPrettify() {
  const [rawSql, setRawSql] = useState(DEFAULT_RAW_SQL);
  const [language, setLanguage] = useState<SqlDialect>(DEFAULT_LANGUAGE);
  const [keywordCase, setKeywordCase] =
    useState<SqlKeywordCase>(DEFAULT_KEYWORD_CASE);
  const [indentStyle, setIndentStyle] =
    useState<SqlIndentStyle>(DEFAULT_INDENT_STYLE);
  const [actionStatus, setActionStatus] = useState("");

  const formatResult = useMemo(
    () =>
      tryFormatSql({
        rawSql,
        language,
        keywordCase,
        indentStyle,
      }),
    [rawSql, language, keywordCase, indentStyle],
  );

  const prettified = formatResult.ok ? formatResult.sql : "";
  const formatError =
    !formatResult.ok && rawSql.trim() !== "" ? formatResult.error : null;

  const copyPrettified = useCallback(async () => {
    if (!prettified) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(prettified);
      setActionStatus("Prettified SQL copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [prettified]);

  return (
    <ToolIsland className="sp-tool">
      <ToolPanel labelledBy="sp-heading" className="sp-tool__panel">
        <ToolSectionHeading
          title="SQL prettify"
          titleId="sp-heading"
          description={
            <ToolHint>
              Paste a SQL query to format it. Choose dialect, keyword case, and
              indent style.
            </ToolHint>
          }
        />

        <ToolFormGrid className="sp-settings">
          <ToolSelect
            id="sp-dialect"
            label="Dialect"
            value={language}
            onChange={(event) =>
              setLanguage(normalizeDialect(event.target.value))
            }
          >
            {SQL_DIALECT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </ToolSelect>

          <ToolSelect
            id="sp-keyword-case"
            label="Keyword case"
            value={keywordCase}
            onChange={(event) =>
              setKeywordCase(normalizeKeywordCase(event.target.value))
            }
          >
            {SQL_KEYWORD_CASE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </ToolSelect>

          <ToolSelect
            id="sp-indent-style"
            label="Indent style"
            value={indentStyle}
            onChange={(event) =>
              setIndentStyle(normalizeIndentStyle(event.target.value))
            }
          >
            {SQL_INDENT_STYLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </ToolSelect>
        </ToolFormGrid>

        <ToolTextarea
          id="sp-input"
          label="Your SQL query"
          full
          code
          rows={12}
          value={rawSql}
          placeholder="Put your SQL query here..."
          onChange={(event) => setRawSql(event.target.value)}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          aria-invalid={formatError ? true : undefined}
        />

        {formatError ? (
          <ToolStatus tone="error" live="polite">
            {formatError}
          </ToolStatus>
        ) : null}

        <ToolTextarea
          id="sp-output"
          label="Prettify version of your query"
          full
          code
          readOnly
          rows={12}
          value={prettified}
          placeholder="Prettified SQL appears here"
          className="sp-output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyPrettified()}
            disabled={!prettified}
          >
            Copy SQL
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}

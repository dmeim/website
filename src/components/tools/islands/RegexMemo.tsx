import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolEmpty,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolWorkspace,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  countRegexMemoEntries,
  filterRegexMemoSections,
  primaryRegexExpression,
  regexMemoReferences,
  slugifyRegexMemoTitle,
} from "@/lib/tools/regex-memo";

import "./RegexMemo.css";

export default function RegexMemo() {
  const [search, setSearch] = useState("");
  const [copyStatus, setCopyStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const total = countRegexMemoEntries();

  const sections = useMemo(() => filterRegexMemoSections(search), [search]);
  const isSearching = search.trim().length > 0;

  const matchCount = useMemo(
    () => sections.reduce((sum, section) => sum + section.entries.length, 0),
    [sections],
  );

  const copyExpression = useCallback(async (expression: string) => {
    try {
      await copyTextToClipboard(primaryRegexExpression(expression));
      setCopyStatus({
        tone: "success",
        message: "Expression copied to the clipboard.",
      });
    } catch {
      setCopyStatus({
        tone: "error",
        message: "Copy failed. Select the expression and copy it manually.",
      });
    }
  }, []);

  return (
    <ToolIsland className="rm-tool">
      <ToolPanel labelledBy="rm-heading" className="rm-tool__panel">
        <ToolSectionHeading
          title="Regex cheatsheet"
          titleId="rm-heading"
          description={
            <ToolHint>
              Quick reference for JavaScript regular expressions ({total}{" "}
              patterns). Try them in the{" "}
              <a className="rm-inline-link" href="/tools/regex-tester">
                Regex tester
              </a>
              .
            </ToolHint>
          }
        />

        <ToolInput
          id="rm-search"
          label="Search"
          full
          value={search}
          placeholder="Search regex expressions…"
          autoComplete="off"
          spellCheck={false}
          autoFocus
          onChange={(event) => setSearch(event.target.value)}
        />

        {copyStatus ? (
          <ToolStatus tone={copyStatus.tone}>{copyStatus.message}</ToolStatus>
        ) : null}
      </ToolPanel>

      {matchCount === 0 ? (
        <ToolEmpty>No regex patterns match this search.</ToolEmpty>
      ) : (
        <div className="rm-sections">
          {sections.map((section, sectionIndex) => {
            const sectionSlug = slugifyRegexMemoTitle(
              section.group
                ? `${section.group}-${section.title}`
                : section.title,
            );
            const showGroup =
              Boolean(section.group) &&
              sections[sectionIndex - 1]?.group !== section.group;
            return (
              <section
                key={`${section.group ?? ""}-${section.title}`}
                className="rm-section"
                aria-labelledby={`rm-sec-${sectionSlug}`}
              >
                {showGroup ? (
                  <p className="rm-section__group">{section.group}</p>
                ) : null}
                <h2 id={`rm-sec-${sectionSlug}`} className="rm-section__title">
                  {section.title}
                </h2>

                <ToolWorkspace className="rm-list">
                  {section.entries.map((entry, index) => {
                    const entryId = `rm-entry-${sectionSlug}-${index}`;
                    return (
                      <ToolPanel
                        key={entryId}
                        className="rm-card"
                        labelledBy={entryId}
                        animate={false}
                      >
                        <div className="rm-card__row">
                          <pre
                            id={entryId}
                            className="rm-card__expression"
                            title={entry.expression}
                          >
                            <code>{entry.expression}</code>
                          </pre>
                          <p className="rm-card__description">
                            {entry.description}
                          </p>
                        </div>
                        <ToolActionRow>
                          <ToolButton
                            type="button"
                            onClick={() => void copyExpression(entry.expression)}
                          >
                            Copy
                          </ToolButton>
                        </ToolActionRow>
                      </ToolPanel>
                    );
                  })}
                </ToolWorkspace>

                {section.notes && section.notes.length > 0 ? (
                  <ul className="rm-notes">
                    {section.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </div>
      )}

      {!isSearching ? (
        <ToolPanel className="rm-refs" labelledBy="rm-refs-heading" animate={false}>
          <h2 id="rm-refs-heading" className="rm-refs__title">
            References and tools
          </h2>
          <ul className="rm-refs__list">
            {regexMemoReferences.map((ref) => (
              <li key={ref.href}>
                <a
                  className="rm-inline-link"
                  href={ref.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {ref.label}
                </a>
              </li>
            ))}
            <li>
              <a className="rm-inline-link" href="/tools/regex-tester">
                Regex tester
              </a>
            </li>
          </ul>
        </ToolPanel>
      ) : null}
    </ToolIsland>
  );
}

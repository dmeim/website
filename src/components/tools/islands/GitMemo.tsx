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
  countGitMemoEntries,
  filterGitMemoSections,
  slugifyGitMemoTitle,
} from "@/lib/tools/git-memo";

import "./GitMemo.css";

export default function GitMemo() {
  const [search, setSearch] = useState("");
  const [copyStatus, setCopyStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const total = countGitMemoEntries();

  const sections = useMemo(() => filterGitMemoSections(search), [search]);

  const matchCount = useMemo(
    () => sections.reduce((sum, section) => sum + section.entries.length, 0),
    [sections],
  );

  const copyCommand = useCallback(async (command: string) => {
    try {
      await copyTextToClipboard(command);
      setCopyStatus({
        tone: "success",
        message: "Command copied to the clipboard.",
      });
    } catch {
      setCopyStatus({
        tone: "error",
        message: "Copy failed. Select the command and copy it manually.",
      });
    }
  }, []);

  return (
    <ToolIsland className="gm-tool">
      <ToolPanel labelledBy="gm-heading" className="gm-tool__panel">
        <ToolSectionHeading
          title="Git cheatsheet"
          titleId="gm-heading"
          description={
            <ToolHint>
              Quick access to the most common Git commands ({total} recipes).
            </ToolHint>
          }
        />

        <ToolInput
          id="gm-search"
          label="Search"
          full
          value={search}
          placeholder="Search git commands…"
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
        <ToolEmpty>No Git commands match this search.</ToolEmpty>
      ) : (
        <div className="gm-sections">
          {sections.map((section) => {
            const sectionSlug = slugifyGitMemoTitle(section.title);
            return (
              <section
                key={section.title}
                className="gm-section"
                aria-labelledby={`gm-sec-${sectionSlug}`}
              >
                <h2 id={`gm-sec-${sectionSlug}`} className="gm-section__title">
                  {section.title}
                </h2>

                <ToolWorkspace className="gm-list">
                  {section.entries.map((entry, index) => {
                    const entryId = `gm-entry-${sectionSlug}-${index}`;
                    return (
                      <ToolPanel
                        key={entryId}
                        className="gm-card"
                        labelledBy={entryId}
                        animate={false}
                      >
                        <h3 id={entryId} className="gm-card__title">
                          {entry.description}
                        </h3>
                        <pre className="gm-card__command">
                          <code>{entry.command}</code>
                        </pre>
                        <ToolActionRow>
                          <ToolButton
                            type="button"
                            onClick={() => void copyCommand(entry.command)}
                          >
                            Copy
                          </ToolButton>
                        </ToolActionRow>
                      </ToolPanel>
                    );
                  })}
                </ToolWorkspace>
              </section>
            );
          })}
        </div>
      )}
    </ToolIsland>
  );
}

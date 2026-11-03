import { useMemo, useState } from "react";

import { CodeBlock, List, ListRow, Panel, ReferenceList, SectionHeading, ToolFrame } from "@/ui/react";
import {
  countGitMemoEntries,
  filterGitMemoSections,
  slugifyGitMemoTitle,
} from "@/lib/tools/git-memo";

export default function GitMemo() {
  const [search, setSearch] = useState("");
  const total = countGitMemoEntries();

  const sections = useMemo(() => filterGitMemoSections(search), [search]);

  const matchCount = useMemo(
    () => sections.reduce((sum, section) => sum + section.entries.length, 0),
    [sections],
  );

  return (
    <ToolFrame>
      <Panel
        title="Git cheatsheet"
        titleId="gm-heading"
        description={`Quick access to the most common Git commands (${total} recipes).`}
      >
        <ReferenceList
          searchLabel="Search Git commands…"
          query={search}
          onQueryChange={setSearch}
          count={matchCount}
          empty={{ icon: "magnifying-glass", title: "No Git commands match this search", size: "sm" }}
        >
          {sections.map((section) => {
            const sectionSlug = slugifyGitMemoTitle(section.title);
            const headingId = `gm-sec-${sectionSlug}`;
            return (
              <section key={section.title} aria-labelledby={headingId}>
                <SectionHeading title={section.title} titleId={headingId} level={3} />
                <List label={section.title}>
                  {section.entries.map((entry, index) => {
                    const entryId = `gm-entry-${sectionSlug}-${index}`;
                    return (
                      <ListRow
                        key={entryId}
                        title={<span id={entryId}>{entry.description}</span>}
                        description={<CodeBlock code={entry.command} label={entry.description} wrap />}
                      />
                    );
                  })}
                </List>
              </section>
            );
          })}
        </ReferenceList>
      </Panel>
    </ToolFrame>
  );
}

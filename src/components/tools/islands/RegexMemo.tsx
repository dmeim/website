import { useMemo, useState } from "react";

import {
  CopyButton,
  Eyebrow,
  Link,
  List,
  ListRow,
  Panel,
  ReferenceList,
  SectionHeading,
  ToolFrame,
} from "@/ui/react";
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
  const total = countRegexMemoEntries();

  const sections = useMemo(() => filterRegexMemoSections(search), [search]);
  const isSearching = search.trim().length > 0;

  const matchCount = useMemo(
    () => sections.reduce((sum, section) => sum + section.entries.length, 0),
    [sections],
  );

  return (
    <ToolFrame layout="stack">
      <Panel
        title="Regex cheatsheet"
        titleId="rm-heading"
        description={
          <>
            Quick reference for JavaScript regular expressions ({total} patterns). Try them in the{" "}
            <Link href="/tools/regex-tester">Regex tester</Link>.
          </>
        }
      >
        <ReferenceList
          searchLabel="Search regex expressions…"
          query={search}
          onQueryChange={setSearch}
          count={matchCount}
          empty={{ icon: "magnifying-glass", title: "No regex patterns match this search", size: "sm" }}
        >
          {sections.map((section, sectionIndex) => {
            const sectionSlug = slugifyRegexMemoTitle(
              section.group ? `${section.group}-${section.title}` : section.title,
            );
            const headingId = `rm-sec-${sectionSlug}`;
            const showGroup =
              Boolean(section.group) && sections[sectionIndex - 1]?.group !== section.group;
            return (
              <section key={`${section.group ?? ""}-${section.title}`} aria-labelledby={headingId}>
                {showGroup ? <Eyebrow>{section.group}</Eyebrow> : null}
                <SectionHeading title={section.title} titleId={headingId} level={3} />
                <List label={section.title}>
                  {section.entries.map((entry, index) => {
                    const entryId = `rm-entry-${sectionSlug}-${index}`;
                    return (
                      <ListRow
                        key={entryId}
                        label={
                          <code id={entryId} className="rm-expression" title={entry.expression}>
                            {entry.expression}
                          </code>
                        }
                        title={entry.description}
                        actions={
                          <CopyButton
                            appearance="icon"
                            label={`Copy ${entry.expression}`}
                            value={primaryRegexExpression(entry.expression)}
                          />
                        }
                      />
                    );
                  })}
                </List>
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
        </ReferenceList>
      </Panel>

      {!isSearching ? (
        <Panel title="References and tools" titleId="rm-refs-heading" animate={false}>
          <List label="References and tools">
            {regexMemoReferences.map((ref) => (
              <ListRow key={ref.href} href={ref.href} title={ref.label} />
            ))}
            <ListRow href="/tools/regex-tester" title="Regex tester" />
          </List>
        </Panel>
      ) : null}
    </ToolFrame>
  );
}

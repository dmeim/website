import { useMemo, useState } from "react";

import { List, ListRow, Panel, ReferenceList, SectionHeading, ToolFrame } from "@/ui/react";
import {
  countHttpStatusCodes,
  filterHttpStatusCategories,
  formatHttpStatusMeaning,
} from "@/lib/tools/http-status-codes";

import "./HttpStatusCodes.css";

export default function HttpStatusCodes() {
  const [search, setSearch] = useState("");
  const total = countHttpStatusCodes();

  const categories = useMemo(() => filterHttpStatusCategories(search), [search]);

  const matchCount = useMemo(
    () => categories.reduce((sum, group) => sum + group.codes.length, 0),
    [categories],
  );

  return (
    <ToolFrame>
      <Panel
        title="HTTP status codes"
        titleId="hsc-heading"
        description={`The list of all HTTP status codes, their name, and their meaning (${total} codes).`}
      >
        <ReferenceList
          searchLabel="Search http status…"
          query={search}
          onQueryChange={setSearch}
          count={matchCount}
          empty={{ icon: "magnifying-glass", title: "No status codes match this search.", size: "sm" }}
        >
          <div className="hsc-categories">
            {categories.map((group) => {
              const headingId = `hsc-cat-${slugify(group.category)}`;
              return (
                <section key={group.category} aria-labelledby={headingId}>
                  <SectionHeading title={group.category} titleId={headingId} level={3} />
                  <List label={group.category}>
                    {group.codes.map((entry) => (
                      <ListRow
                        key={entry.code}
                        label={<span className="hsc-code">{entry.code}</span>}
                        title={entry.name}
                        description={formatHttpStatusMeaning(entry)}
                      />
                    ))}
                  </List>
                </section>
              );
            })}
          </div>
        </ReferenceList>
      </Panel>
    </ToolFrame>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

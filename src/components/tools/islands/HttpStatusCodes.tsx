import { useMemo, useState } from "react";

import {
  ToolEmpty,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolWorkspace,
} from "@/components/tools/ui";
import {
  countHttpStatusCodes,
  filterHttpStatusCategories,
  formatHttpStatusMeaning,
  formatHttpStatusTitle,
} from "@/lib/tools/http-status-codes";

import "./HttpStatusCodes.css";

export default function HttpStatusCodes() {
  const [search, setSearch] = useState("");
  const total = countHttpStatusCodes();

  const categories = useMemo(
    () => filterHttpStatusCategories(search),
    [search],
  );

  const matchCount = useMemo(
    () => categories.reduce((sum, group) => sum + group.codes.length, 0),
    [categories],
  );

  return (
    <ToolIsland className="hsc-tool">
      <ToolPanel labelledBy="hsc-heading" className="hsc-tool__panel">
        <ToolSectionHeading
          title="HTTP status codes"
          titleId="hsc-heading"
          description={
            <ToolHint>
              The list of all HTTP status codes, their name, and their meaning
              ({total} codes).
            </ToolHint>
          }
        />

        <ToolInput
          id="hsc-search"
          label="Search"
          full
          value={search}
          placeholder="Search http status…"
          autoComplete="off"
          spellCheck={false}
          autoFocus
          onChange={(event) => setSearch(event.target.value)}
        />
      </ToolPanel>

      {matchCount === 0 ? (
        <ToolEmpty>No status codes match this search.</ToolEmpty>
      ) : (
        <div className="hsc-categories">
          {categories.map((group) => (
            <section
              key={group.category}
              className="hsc-category"
              aria-labelledby={`hsc-cat-${slugify(group.category)}`}
            >
              <h2
                id={`hsc-cat-${slugify(group.category)}`}
                className="hsc-category__title"
              >
                {group.category}
              </h2>

              <ToolWorkspace className="hsc-list">
                {group.codes.map((entry) => (
                  <ToolPanel
                    key={entry.code}
                    className="hsc-card"
                    labelledBy={`hsc-code-${entry.code}`}
                    animate={false}
                  >
                    <h3 id={`hsc-code-${entry.code}`} className="hsc-card__title">
                      {formatHttpStatusTitle(entry)}
                    </h3>
                    <p className="hsc-card__meaning">
                      {formatHttpStatusMeaning(entry)}
                    </p>
                  </ToolPanel>
                ))}
              </ToolWorkspace>
            </section>
          ))}
        </div>
      )}
    </ToolIsland>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

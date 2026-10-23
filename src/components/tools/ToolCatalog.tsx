import { useState } from "react";
import {
  plannedTools,
  toolCategories,
  toolRoute,
  type Tool,
  type ToolCategory,
} from "@/content/tools";
import { Badge, Disclosure, List, ListRow, PageHeader, ReferenceList } from "@/ui/react";
import { isPlainClick } from "./ToolsSidebar";

type Props = {
  onOpenTool: (slug: string) => void;
};

function CatalogRow({ tool, onOpenTool }: { tool: Tool; onOpenTool: (slug: string) => void }) {
  const href = toolRoute(tool);
  if (!href) {
    return (
      <ListRow
        title={tool.title}
        description={tool.description}
        badge={{ children: "WIP" }}
        aria-label={`${tool.title} is work in progress`}
      />
    );
  }
  return (
    <ListRow
      title={tool.title}
      description={tool.description}
      href={href}
      onClick={(event) => {
        if (!isPlainClick(event)) return;
        event.preventDefault();
        onOpenTool(tool.id);
      }}
    />
  );
}

function categoryHasWip(category: ToolCategory): boolean {
  return category.tools.some((tool) => !toolRoute(tool));
}

export function ToolCatalog({ onOpenTool }: Props) {
  const [query, setQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => new Set(["personal"]));
  const normalizedQuery = query.trim().toLowerCase();
  const visibleCategories = toolCategories
    .map((category) => ({
      ...category,
      tools: category.tools.filter((tool) =>
        `${tool.title} ${tool.description} ${(tool.tags ?? []).join(" ")}`.toLowerCase().includes(normalizedQuery),
      ),
    }))
    .filter((category) => category.tools.length > 0);
  const matchingCount = visibleCategories.reduce((sum, category) => sum + category.tools.length, 0);
  const total = toolCategories.reduce((sum, category) => sum + category.tools.length, 0);
  const wipCount = plannedTools().length;

  return (
    <section className="tools-catalog" aria-labelledby="tools-catalog-heading">
      <PageHeader
        eyebrow="Browse"
        title="All tools"
        titleId="tools-catalog-heading"
        lede="A collection of practical utilities for everyday work. Find a tool or browse by category."
        meta={
          <span>
            {total} total
            {wipCount > 0 ? ` · ${wipCount} WIP` : null}
          </span>
        }
      />

      <ReferenceList
        searchLabel="Find a tool"
        query={query}
        onQueryChange={setQuery}
        count={normalizedQuery ? matchingCount : undefined}
        empty={{ icon: "magnifying-glass", title: "No matching tools", size: "sm" }}
      >
        <div className="tools-catalog__stack">
          {visibleCategories.map((category) => (
            <Disclosure
              key={category.id}
              id={`category-${category.id}`}
              className="tools-catalog__category"
              summary={
                <>
                  {category.name}
                  {categoryHasWip(category) ? (
                    <>
                      {" "}
                      <Badge size="sm" title="Contains WIP tools">WIP</Badge>
                    </>
                  ) : null}
                </>
              }
              meta={category.tools.length}
              open={Boolean(normalizedQuery) || expandedCategories.has(category.id)}
              onToggle={(open) => {
                if (normalizedQuery) return;
                setExpandedCategories((current) => {
                  if (current.has(category.id) === open) return current;
                  const next = new Set(current);
                  if (open) next.add(category.id);
                  else next.delete(category.id);
                  return next;
                });
              }}
            >
              <p className="tools-catalog__category-desc">{category.description}</p>
              <List label={category.name}>
                {category.tools.map((tool) => (
                  <CatalogRow key={tool.id} tool={tool} onOpenTool={onOpenTool} />
                ))}
              </List>
            </Disclosure>
          ))}
        </div>
      </ReferenceList>
    </section>
  );
}

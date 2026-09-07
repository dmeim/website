import { useState } from "react";
import {
  plannedTools,
  toolCategories,
  toolRoute,
  type Tool,
  type ToolCategory,
} from "@/content/tools";

type Props = {
  onOpenTool: (slug: string) => void;
  onOpenSidebar?: () => void;
};

function CatalogItem({
  tool,
  onOpenTool,
}: {
  tool: Tool;
  onOpenTool: (slug: string) => void;
}) {
  const href = toolRoute(tool);
  const isAvailable = Boolean(href);

  if (isAvailable && href) {
    return (
      <a
        href={href}
        className="tools-catalog-item is-available"
        onClick={(event) => {
          if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          ) {
            return;
          }
          event.preventDefault();
          onOpenTool(tool.id);
        }}
      >
        <span className="tools-catalog-item__title">{tool.title}</span>
        <span className="tools-catalog-item__desc">{tool.description}</span>
      </a>
    );
  }

  return (
    <div
      className="tools-catalog-item is-wip"
      aria-label={`${tool.title} is work in progress`}
    >
      <span className="tools-catalog-item__row">
        <span className="tools-catalog-item__title">{tool.title}</span>
        <span className="tools-catalog-item__badge">WIP</span>
      </span>
      <span className="tools-catalog-item__desc">{tool.description}</span>
    </div>
  );
}

function categoryHasWip(category: ToolCategory): boolean {
  return category.tools.some((tool) => !toolRoute(tool));
}

export function ToolCatalog({ onOpenTool, onOpenSidebar }: Props) {
  const [query, setQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => new Set(["personal"]));
  const normalizedQuery = query.trim().toLowerCase();
  const visibleCategories = toolCategories.map((category) => ({
    ...category,
    tools: category.tools.filter((tool) =>
      `${tool.title} ${tool.description} ${(tool.tags ?? []).join(" ")}`.toLowerCase().includes(normalizedQuery),
    ),
  })).filter((category) => category.tools.length > 0);
  const matchingCount = visibleCategories.reduce((sum, category) => sum + category.tools.length, 0);
  const total = toolCategories.reduce(
    (sum, category) => sum + category.tools.length,
    0,
  );
  const wipCount = plannedTools().length;

  return (
    <section className="tools-catalog" aria-labelledby="tools-catalog-heading">
      <header className="tools-main__header">
        {onOpenSidebar ? (
          <button
            type="button"
            className="tools-main__menu"
            onClick={onOpenSidebar}
            aria-label="Open tools menu"
          >
            Menu
          </button>
        ) : null}
        <div className="tools-main__title-block">
          <p className="tools-main__eyebrow">Browse</p>
          <h1 id="tools-catalog-heading" className="tools-main__title">
            All tools
          </h1>
        </div>
        <p className="tools-catalog__count">
          {total} total
          {wipCount > 0 ? ` · ${wipCount} WIP` : null}
        </p>
      </header>

      <div className="tools-catalog__body">
        <p className="tools-catalog__lede">
          A collection of practical utilities for everyday work. Find a tool or browse by category.
        </p>

        <div className="tools-catalog__search">
          <label htmlFor="tools-catalog-search">Find a tool</label>
          <input
            id="tools-catalog-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or task…"
            autoComplete="off"
          />
          {normalizedQuery ? <p role="status">{matchingCount} matching {matchingCount === 1 ? "tool" : "tools"}</p> : null}
        </div>
        <div className="tools-catalog__stack">
          {visibleCategories.map((category) => {
            const hasWip = categoryHasWip(category);
            return (
              <details
                key={category.id}
                className="tools-catalog__category"
                id={`category-${category.id}`}
                open={Boolean(normalizedQuery) || expandedCategories.has(category.id)}
                onToggle={(event) => {
                  if (normalizedQuery) return;
                  const open = event.currentTarget.open;
                  setExpandedCategories((current) => {
                    if (current.has(category.id) === open) return current;
                    const next = new Set(current);
                    if (open) next.add(category.id);
                    else next.delete(category.id);
                    return next;
                  });
                }}
              >
                <summary>
                  <span className="tools-catalog__category-title">
                    <strong>
                      {category.name}
                      {hasWip ? (
                        <span className="tools-wip-badge" title="Contains WIP tools">
                          WIP
                        </span>
                      ) : null}
                    </strong>
                    <span className="tools-catalog__category-desc">
                      {category.description}
                    </span>
                  </span>
                </summary>
                <div className="tools-catalog__items">
                  {category.tools.map((tool) => (
                    <CatalogItem
                      key={tool.id}
                      tool={tool}
                      onOpenTool={onOpenTool}
                    />
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}

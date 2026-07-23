import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide";
import {
  availableTools,
  getCategoryForTool,
  plannedTools,
  toolCategories,
  toolRoute,
  type Tool,
  type ToolCategory,
} from "@/content/tools";
import { LucideIcon } from "@/components/chat/LucideIcon";

type Props = {
  activeSlug: string | null;
  onSelectCatalog: () => void;
  onSelectTool: (slug: string) => void;
};

function toolMatches(tool: Tool, query: string): boolean {
  if (!query) return true;
  const hay = `${tool.title} ${tool.description} ${(tool.tags ?? []).join(" ")}`.toLowerCase();
  return hay.includes(query);
}

function categoryHasWip(category: ToolCategory): boolean {
  return category.tools.some((tool) => !toolRoute(tool));
}

export function ToolsSidebar({
  activeSlug,
  onSelectCatalog,
  onSelectTool,
}: Props) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const availableCount = availableTools().length;
  const plannedCount = plannedTools().length;
  const activeCategoryId = activeSlug
    ? getCategoryForTool(activeSlug)?.id
    : undefined;

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  const normalizedQuery = query.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    return toolCategories
      .map((category) => ({
        ...category,
        tools: category.tools.filter((tool) =>
          toolMatches(tool, normalizedQuery),
        ),
      }))
      .filter((category) => category.tools.length > 0);
  }, [normalizedQuery]);

  return (
    <aside className="tools-sidebar" aria-label="Tool categories">
      <div className="tools-sidebar__top">
        <div className="tools-sidebar__head">
          <p className="tools-sidebar__eyebrow">Catalogue</p>
          <h2 className="tools-sidebar__title">Tools</h2>
          <p className="tools-sidebar__meta">
            {availableCount} ready
            {plannedCount > 0 ? ` · ${plannedCount} WIP` : null}
          </p>
        </div>

        <button
          type="button"
          className={
            !activeSlug
              ? "tools-sidebar__home is-active"
              : "tools-sidebar__home"
          }
          onClick={onSelectCatalog}
        >
          All tools
        </button>
      </div>

      <div className="tools-sidebar__section">
        <div className="tools-sidebar__section-head">
          {searchOpen ? (
            <div className="tools-sidebar__search-field">
              <label className="visually-hidden" htmlFor="tools-sidebar-search">
                Search tools
              </label>
              <input
                ref={searchInputRef}
                id="tools-sidebar-search"
                type="search"
                className="tools-sidebar__search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tools…"
                autoComplete="off"
              />
              <button
                type="button"
                className="tools-sidebar__search-close"
                onMouseDown={(event) => event.preventDefault()}
                onClick={closeSearch}
                aria-label="Close search"
                title="Close"
              >
                <LucideIcon icon={X} size={16} />
              </button>
            </div>
          ) : (
            <>
              <h2 className="tools-sidebar__heading">Categories</h2>
              <button
                type="button"
                className="tools-sidebar__search-btn"
                onClick={() => setSearchOpen(true)}
                aria-label="Search tools"
                title="Search tools"
              >
                <LucideIcon icon={Search} size={16} />
              </button>
            </>
          )}
        </div>

        <nav className="tools-sidebar__nav" aria-label="Categories">
          {filteredCategories.length === 0 ? (
            <p className="tools-sidebar__empty">No matching tools</p>
          ) : (
            filteredCategories.map((category) => {
              const hasWip = categoryHasWip(category);
              const forceOpen =
                Boolean(normalizedQuery) || activeCategoryId === category.id;
              return (
                <details
                  key={`${category.id}:${normalizedQuery ? "q" : "n"}:${forceOpen ? "open" : "shut"}`}
                  className="tools-sidebar__category"
                  defaultOpen={forceOpen}
                >
                  <summary>
                    <span className="tools-sidebar__category-name">
                      {category.name}
                      {hasWip ? (
                        <span
                          className="tools-wip-badge"
                          title="Contains WIP tools"
                        >
                          WIP
                        </span>
                      ) : null}
                    </span>
                    <span className="tools-sidebar__category-count">
                      {category.tools.length}
                    </span>
                  </summary>
                  <ul className="tools-sidebar__list" role="list">
                    {category.tools.map((tool) => {
                      const href = toolRoute(tool);
                      const isActive = activeSlug === tool.id;
                      if (href) {
                        return (
                          <li key={tool.id}>
                            <button
                              type="button"
                              className={
                                isActive
                                  ? "tools-sidebar__item is-available is-active"
                                  : "tools-sidebar__item is-available"
                              }
                              onClick={() => onSelectTool(tool.id)}
                              aria-current={isActive ? "page" : undefined}
                            >
                              <span className="tools-sidebar__item-label">
                                {tool.title}
                              </span>
                            </button>
                          </li>
                        );
                      }
                      return (
                        <li key={tool.id}>
                          <span
                            className="tools-sidebar__item is-wip"
                            title="Work in progress"
                          >
                            <span className="tools-sidebar__item-label">
                              {tool.title}
                            </span>
                            <span className="tools-wip-badge">WIP</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              );
            })
          )}
        </nav>
      </div>
    </aside>
  );
}

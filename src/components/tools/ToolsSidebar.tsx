import { useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  getCategoryForTool,
  toolCategories,
  toolRoute,
  type Tool,
  type ToolCategory,
} from "@/content/tools";
import { EmptyState, Input, List, ListRow, SideNav, type SideNavSection } from "@/ui/react";

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

/** Plain left clicks are handled in-app; modified clicks keep native link behaviour. */
export function isPlainClick(event: MouseEvent<HTMLElement>): boolean {
  return !(
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

export function ToolsSidebar({ activeSlug, onSelectCatalog, onSelectTool }: Props) {
  const [query, setQuery] = useState("");
  const activeCategoryId = activeSlug ? getCategoryForTool(activeSlug)?.id : undefined;

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(activeCategoryId ? [activeCategoryId] : []),
  );

  useEffect(() => {
    if (activeCategoryId) {
      setExpandedCategories((current) => new Set(current).add(activeCategoryId));
    }
  }, [activeCategoryId]);

  const normalizedQuery = query.trim().toLowerCase();

  const sections = useMemo<SideNavSection[]>(() => {
    return toolCategories
      .map((category) => ({
        category,
        tools: category.tools.filter((tool) => toolMatches(tool, normalizedQuery)),
      }))
      .filter(({ tools }) => tools.length > 0)
      .map(({ category, tools }) => ({
        id: category.id,
        title: category.name,
        badge: categoryHasWip(category) ? "WIP" : undefined,
        count: tools.length,
        collapsible: true,
        open: Boolean(normalizedQuery) || expandedCategories.has(category.id),
        items: tools.map((tool) => {
          const href = toolRoute(tool);
          return {
            id: tool.id,
            href: href ?? undefined,
            label: tool.title,
            badge: href ? undefined : "WIP",
            disabled: !href,
            current: activeSlug === tool.id,
          };
        }),
      }));
  }, [normalizedQuery, expandedCategories, activeSlug]);

  const header = (
    <>
      <List density="compact" divided={false} className="tools-sidebar__home">
        <ListRow
          title="All tools"
          icon="toolbox"
          href="/tools"
          current={!activeSlug}
          arrow={false}
          onClick={(event) => {
            if (!isPlainClick(event)) return;
            event.preventDefault();
            onSelectCatalog();
          }}
        />
      </List>
      <Input
        id="tools-sidebar-search"
        type="search"
        label="Search tools"
        labelHidden
        iconStart="magnifying-glass"
        size="sm"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery("")}
        placeholder="Search tools…"
        autoComplete="off"
      />
      {sections.length === 0 ? <EmptyState size="sm" title="No matching tools" /> : null}
    </>
  );

  return (
    <SideNav
      className="tools-sidebar"
      label="Tool categories"
      header={header}
      sections={sections}
      onNavigate={(item, event) => {
        if (item.disabled || !isPlainClick(event)) return;
        event.preventDefault();
        onSelectTool(item.id);
      }}
      onToggleSection={(id, open) => {
        if (normalizedQuery) return;
        setExpandedCategories((current) => {
          if (current.has(id) === open) return current;
          const next = new Set(current);
          if (open) next.add(id);
          else next.delete(id);
          return next;
        });
      }}
    />
  );
}

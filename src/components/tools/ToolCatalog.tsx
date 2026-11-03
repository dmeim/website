import { useState } from "react";
import { allTools, getCategoryForTool, plannedTools, toolCategories, toolRoute, toolsCatalogue, type Tool } from "@/content/tools";
import { List, ListRow, PageHeader, ReferenceList } from "@/ui/react";
import { isPlainClick, toolMatches } from "./tool-links";

type Props = {
  onOpenTool: (slug: string) => void;
};

function CatalogRow({ tool, onOpenTool }: { tool: Tool; onOpenTool: (slug: string) => void }) {
  const href = toolRoute(tool);
  const description = `${getCategoryForTool(tool.id)?.name} · ${tool.description}`;
  if (!href) {
    return (
      <ListRow
        title={tool.title}
        description={description}
        badge={{ children: "WIP" }}
        aria-label={`${tool.title} is work in progress`}
      />
    );
  }
  return (
    <ListRow
      title={tool.title}
      description={description}
      href={href}
      onClick={(event) => {
        if (!isPlainClick(event)) return;
        event.preventDefault();
        onOpenTool(tool.id);
      }}
    />
  );
}

/** /tools landing: intro and a flat search over every tool. Groups live in the rail nav (SiteNavTools). */
export function ToolCatalog({ onOpenTool }: Props) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const tools = allTools();
  const matches = normalized ? tools.filter((tool) => toolMatches(tool, normalized)) : [];
  const wipCount = plannedTools().length;

  return (
    <section className="tools-catalog" aria-labelledby="tools-catalog-heading">
      <PageHeader
        title="Tools"
        titleId="tools-catalog-heading"
        lede={toolsCatalogue.tagline}
        meta={
          <span>
            {tools.length} tools in {toolCategories.length} groups
            {wipCount > 0 ? ` · ${wipCount} WIP` : null}
          </span>
        }
      />

      <ReferenceList
        searchLabel="Find a tool"
        query={query}
        onQueryChange={setQuery}
        count={normalized ? matches.length : undefined}
        empty={{ icon: "magnifying-glass", title: "No matching tools", size: "sm" }}
      >
        {normalized && (
          <List label="Matching tools">
            {matches.map((tool) => (
              <CatalogRow key={tool.id} tool={tool} onOpenTool={onOpenTool} />
            ))}
          </List>
        )}
      </ReferenceList>
    </section>
  );
}

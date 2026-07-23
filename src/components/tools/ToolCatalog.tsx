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
          Local-first utilities inspired by it-tools — ready tools open here;
          everything else stays visible as WIP until it ships.
        </p>

        <div className="tools-catalog__stack">
          {toolCategories.map((category) => {
            const hasWip = categoryHasWip(category);
            return (
              <details
                key={category.id}
                className="tools-catalog__category"
                id={`category-${category.id}`}
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

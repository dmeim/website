import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { getCategoryForTool, getToolById } from "@/content/tools";
import { Breadcrumbs, PageHeader } from "@/ui/react";
import type { ToolsRouteDetail, ToolsSelectDetail } from "@/ui/lib/tools-nav";
import { ToolCatalog } from "./ToolCatalog";
import { ToolMount } from "./ToolMount";
import { isPlainClick } from "./tool-links";
import "./ToolsShell.css";

type Props = {
  initialSlug?: string | null;
};

type AstroPreparationEvent = Event & {
  from: URL;
  to: URL;
  loader: () => Promise<void>;
};

type AstroSwapEvent = Event & {
  swap: () => Promise<void> | void;
};

function pathForSlug(slug: string | null): string {
  return slug ? `/tools/${slug}` : "/tools";
}

function slugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/tools(?:\/([^/]+))?\/?$/);
  if (!match) return null;
  return match[1] ?? null;
}

function isToolsPath(pathname: string): boolean {
  return pathname === "/tools" || pathname.startsWith("/tools/");
}

function titleForSlug(slug: string | null): string {
  if (!slug) return "Tools";
  return getToolById(slug)?.title ?? "Tools";
}

function pageTitle(slug: string | null): string {
  return slug ? `${titleForSlug(slug)} · Tools · dmeim.com` : "Tools · dmeim.com";
}

/**
 * In-shell History updates use `null` state so Astro ClientRouter ignores
 * those popstate entries (it only handles non-null VT state).
 * Tools↔tools traversals that still hit ClientRouter are no-op'd below.
 */
export default function ToolsShell({ initialSlug = null }: Props) {
  const [activeSlug, setActiveSlug] = useState<string | null>(initialSlug);
  const navigatedRef = useRef(false);

  const applySlug = useCallback((slug: string | null) => {
    navigatedRef.current = true;
    setActiveSlug(slug);
    document.title = pageTitle(slug);
    // The rail's tool groups (src/ui/lib/tools-nav.ts) follow along.
    window.dispatchEvent(new CustomEvent<ToolsRouteDetail>("tools:route", { detail: { slug } }));
  }, []);

  const syncUrl = useCallback((slug: string | null, mode: "push" | "replace") => {
    const next = pathForSlug(slug);
    if (typeof window === "undefined") return;
    if (window.location.pathname === next) return;
    if (mode === "push") {
      window.history.pushState(null, "", next);
    } else {
      window.history.replaceState(null, "", next);
    }
  }, []);

  const selectSlug = useCallback(
    (slug: string | null, mode: "push" | "replace" = "push") => {
      applySlug(slug);
      syncUrl(slug, mode);
    },
    [applySlug, syncUrl],
  );

  useEffect(() => {
    document.title = pageTitle(activeSlug);
    if (!navigatedRef.current) return;
    const heading = document.getElementById(activeSlug ? "tools-stage-title" : "tools-catalog-heading");
    if (!heading) return;
    heading.setAttribute("tabindex", "-1");
    heading.focus();
  }, [activeSlug]);

  useEffect(() => {
    const onSelect = (event: Event) => selectSlug((event as CustomEvent<ToolsSelectDetail>).detail.slug);
    window.addEventListener("tools:select", onSelect);
    return () => window.removeEventListener("tools:select", onSelect);
  }, [selectSlug]);

  useEffect(() => {
    const onPopState = () => {
      if (!isToolsPath(window.location.pathname)) return;
      applySlug(slugFromPath(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [applySlug]);

  useEffect(() => {
    const onPrep = (event: Event) => {
      const prep = event as AstroPreparationEvent;
      if (!isToolsPath(prep.from.pathname) || !isToolsPath(prep.to.pathname)) {
        return;
      }
      applySlug(slugFromPath(prep.to.pathname));
      prep.loader = async () => {};
      document.addEventListener(
        "astro:before-swap",
        (swapEvent) => {
          (swapEvent as AstroSwapEvent).swap = () => {};
        },
        { once: true },
      );
    };
    document.addEventListener("astro:before-preparation", onPrep);
    return () => document.removeEventListener("astro:before-preparation", onPrep);
  }, [applySlug]);

  const activeTool = activeSlug ? getToolById(activeSlug) : null;
  const activeCategory = activeSlug ? getCategoryForTool(activeSlug) : undefined;

  const onBreadcrumbClick = (event: MouseEvent<HTMLElement>) => {
    const link = (event.target as HTMLElement).closest("a");
    if (!link || link.getAttribute("href") !== "/tools" || !isPlainClick(event)) return;
    event.preventDefault();
    selectSlug(null);
  };

  return (
    <div className="tools-shell">
      <section className="tools-main" aria-label="Tool workspace">
        {activeSlug && activeTool ? (
          <div className="tools-stage" key={activeSlug}>
            <div className="tools-stage__crumbs" onClick={onBreadcrumbClick}>
              <Breadcrumbs
                items={[
                  { label: "Tools", href: "/tools" },
                  { label: activeCategory?.name ?? "Tool" },
                ]}
              />
            </div>
            <PageHeader
              className="tools-stage__header"
              titleId="tools-stage-title"
              title={activeTool.title}
              lede={activeTool.description}
            />
            <ToolMount slug={activeSlug} />
          </div>
        ) : (
          <ToolCatalog onOpenTool={(slug) => selectSlug(slug)} />
        )}
      </section>
    </div>
  );
}

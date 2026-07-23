import { useCallback, useEffect, useState } from "react";
import { getToolById } from "@/content/tools";
import { ToolCatalog } from "./ToolCatalog";
import { ToolMount } from "./ToolMount";
import { ToolsSidebar } from "./ToolsSidebar";
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
  return `${titleForSlug(slug)} · dmeim.com`;
}

/**
 * In-shell History updates use `null` state so Astro ClientRouter ignores
 * those popstate entries (it only handles non-null VT state).
 * Tools↔tools traversals that still hit ClientRouter are no-op'd below.
 */
export default function ToolsShell({ initialSlug = null }: Props) {
  const [activeSlug, setActiveSlug] = useState<string | null>(initialSlug);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const applySlug = useCallback((slug: string | null) => {
    setActiveSlug(slug);
    setSidebarOpen(false);
    document.title = pageTitle(slug);
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
  }, [activeSlug]);

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  const activeTool = activeSlug ? getToolById(activeSlug) : null;

  return (
    <div
      className="tools-shell"
      data-sidebar-open={sidebarOpen ? "true" : "false"}
    >
      <button
        type="button"
        className="tools-shell__backdrop"
        aria-label="Close sidebar"
        onClick={() => setSidebarOpen(false)}
      />

      <ToolsSidebar
        activeSlug={activeSlug}
        onSelectCatalog={() => selectSlug(null)}
        onSelectTool={(slug) => selectSlug(slug)}
      />

      <section className="tools-main" aria-label="Tool workspace">
        {activeSlug && activeTool ? (
          <div className="tools-stage">
            <header className="tools-main__header">
              <button
                type="button"
                className="tools-main__menu"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open tools menu"
              >
                Menu
              </button>
              <div className="tools-main__title-block">
                <p className="tools-main__eyebrow">Tool</p>
                <h1 className="tools-main__title">{activeTool.title}</h1>
              </div>
            </header>
            <div className="tools-stage__body">
              <p className="tools-stage__lede">{activeTool.description}</p>
              <ToolMount slug={activeSlug} />
            </div>
          </div>
        ) : (
          <ToolCatalog
            onOpenTool={(slug) => selectSlug(slug)}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        )}
      </section>
    </div>
  );
}

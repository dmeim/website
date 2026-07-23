import { useCallback, useEffect, useState } from "react";
import { getToolById } from "@/content/tools";
import { ToolCatalog } from "./ToolCatalog";
import { ToolMount } from "./ToolMount";
import { ToolsSidebar } from "./ToolsSidebar";
import "./ToolsShell.css";

type Props = {
  initialSlug?: string | null;
};

function pathForSlug(slug: string | null): string {
  return slug ? `/tools/${slug}` : "/tools";
}

function slugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/tools(?:\/([^/]+))?\/?$/);
  if (!match) return null;
  return match[1] ?? null;
}

function titleForSlug(slug: string | null): string {
  if (!slug) return "Tools";
  return getToolById(slug)?.title ?? "Tools";
}

export default function ToolsShell({ initialSlug = null }: Props) {
  const [activeSlug, setActiveSlug] = useState<string | null>(initialSlug);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const syncUrl = useCallback((slug: string | null, mode: "push" | "replace") => {
    const next = pathForSlug(slug);
    if (typeof window === "undefined") return;
    if (window.location.pathname === next) {
      window.history.replaceState({ toolsSlug: slug }, "", next);
      return;
    }
    if (mode === "push") {
      window.history.pushState({ toolsSlug: slug }, "", next);
    } else {
      window.history.replaceState({ toolsSlug: slug }, "", next);
    }
  }, []);

  const selectSlug = useCallback(
    (slug: string | null, mode: "push" | "replace" = "push") => {
      setActiveSlug(slug);
      setSidebarOpen(false);
      syncUrl(slug, mode);
      document.title = `${titleForSlug(slug)} · dmeim.com`;
    },
    [syncUrl],
  );

  useEffect(() => {
    document.title = `${titleForSlug(activeSlug)} · dmeim.com`;
  }, [activeSlug]);

  useEffect(() => {
    const onPopState = () => {
      const slug = slugFromPath(window.location.pathname);
      setActiveSlug(slug);
      setSidebarOpen(false);
      document.title = `${titleForSlug(slug)} · dmeim.com`;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

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

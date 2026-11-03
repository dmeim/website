import { useEffect, useState, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { Drawer } from "./Drawer";

export type AppShellProps = {
  sidebar: ReactNode;
  sidebarLabel: string;
  sidebarOpen: boolean;
  onSidebarOpenChange: (open: boolean) => void;
  header?: ReactNode;
  children?: ReactNode;
  breakpoint?: number;
  ref?: Ref<HTMLDivElement>;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

/** undefined until hydrated, so the CSS media query decides the first paint. */
function useNarrow(breakpoint: number): boolean | undefined {
  const [narrow, setNarrow] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${breakpoint - 0.02}px)`);
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [breakpoint]);
  return narrow;
}

/**
 * Sidebar + main app frame. The main area scrolls; pass `data-main-scroll="false"`
 * when the app owns its own scroller.
 */
export function AppShell({
  sidebar,
  sidebarLabel,
  sidebarOpen,
  onSidebarOpenChange,
  header,
  children,
  breakpoint = 900,
  className,
  ...rest
}: AppShellProps) {
  const narrow = useNarrow(breakpoint);

  return (
    <div
      {...rest}
      className={cx("ui-app-shell", className)}
      data-sidebar-open={sidebarOpen ? "true" : "false"}
      data-layout={narrow === undefined ? undefined : narrow ? "narrow" : "wide"}
    >
      {narrow ? (
        <Drawer
          open={sidebarOpen}
          onClose={() => onSidebarOpenChange(false)}
          side="start"
          modal
          title={sidebarLabel}
          titleHidden
          className="ui-app-shell__drawer"
        >
          {sidebar}
        </Drawer>
      ) : (
        <aside className="ui-app-shell__sidebar" aria-label={sidebarLabel}>
          {sidebar}
        </aside>
      )}
      <div className="ui-app-shell__main">
        {header && <div className="ui-app-shell__header">{header}</div>}
        <div className="ui-app-shell__content">{children}</div>
      </div>
    </div>
  );
}

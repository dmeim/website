import type { ReactNode } from "react";

import { cx } from "./cx";

type ToolFormGridProps = {
  children: ReactNode;
  className?: string;
  /** Three-column export options layout. */
  exportLayout?: boolean;
};

export function ToolFormGrid({
  children,
  className,
  exportLayout = false,
}: ToolFormGridProps) {
  return (
    <div
      className={cx(
        "tool-form-grid",
        exportLayout && "tool-form-grid--export",
        className,
      )}
    >
      {children}
    </div>
  );
}

type ToolNestedProps = {
  children: ReactNode;
  title?: ReactNode;
  className?: string;
};

export function ToolNested({ children, title, className }: ToolNestedProps) {
  return (
    <div className={cx("tool-nested", className)}>
      {title ? <h3>{title}</h3> : null}
      {children}
    </div>
  );
}

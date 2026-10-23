import type { ReactNode, Ref, TableHTMLAttributes } from "react";
import { cx } from "@/ui/lib/cx";

export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  caption?: string;
  captionHidden?: boolean;
  density?: "compact" | "normal";
  stickyHeader?: boolean;
  striped?: boolean;
  scroll?: boolean;
  children?: ReactNode;
  ref?: Ref<HTMLTableElement>;
};

export function Table({
  caption,
  captionHidden,
  density = "normal",
  stickyHeader,
  striped,
  scroll = true,
  className,
  children,
  ...rest
}: TableProps) {
  return (
    <div
      className={cx("ui-table", className)}
      data-density={density}
      data-sticky={stickyHeader ? "true" : undefined}
      data-striped={striped ? "true" : undefined}
      data-scroll={scroll ? "true" : "false"}
      {...(scroll ? { tabIndex: 0, role: "region", "aria-label": caption } : {})}
    >
      <table {...rest} className="ui-table__table">
        {caption && <caption className={cx("ui-table__caption", captionHidden && "ui-visually-hidden")}>{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

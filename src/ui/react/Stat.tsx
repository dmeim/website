import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/ui/lib/cx";

export type StatProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  label: string;
  value: string | number;
  size?: "md" | "lg" | "xl";
  mono?: boolean;
  hint?: string;
  live?: boolean;
  ref?: Ref<HTMLDivElement>;
};

export function Stat({ label, value, size = "md", mono, hint, live, className, ...rest }: StatProps) {
  return (
    <div {...rest} className={cx("ui-stat", className)} data-size={size} data-mono={mono ? "true" : undefined}>
      <p className="ui-stat__label">{label}</p>
      <p className="ui-stat__value" aria-live={live ? "polite" : undefined}>{value}</p>
      {hint && <p className="ui-stat__hint">{hint}</p>}
    </div>
  );
}

export type StatGridProps = HTMLAttributes<HTMLDivElement> & {
  items?: StatProps[];
  columns?: "auto" | 2 | 3 | 4;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
};

export function StatGrid({ items, columns = "auto", className, children, ...rest }: StatGridProps) {
  return (
    <div {...rest} className={cx("ui-stat-grid", className)} data-columns={columns}>
      {items ? items.map((item, index) => <Stat key={`${item.label}-${index}`} {...item} />) : children}
    </div>
  );
}

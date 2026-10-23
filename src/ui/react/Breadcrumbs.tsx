import type { ComponentPropsWithRef } from "react";
import { cx } from "@/ui/lib/cx";

export type BreadcrumbsProps = ComponentPropsWithRef<"nav"> & {
  items: Array<{ label: string; href?: string }>;
};

export function Breadcrumbs({ items, className, ...rest }: BreadcrumbsProps) {
  return (
    <nav {...rest} className={cx("ui-breadcrumbs", className)} aria-label="Breadcrumb">
      <ol className="ui-breadcrumbs__list">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="ui-breadcrumbs__item">
              {item.href && !last ? (
                <a className="ui-breadcrumbs__link" href={item.href}>{item.label}</a>
              ) : (
                <span className="ui-breadcrumbs__current" aria-current={last ? "page" : undefined}>{item.label}</span>
              )}
              {!last && <span className="ui-breadcrumbs__sep" aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

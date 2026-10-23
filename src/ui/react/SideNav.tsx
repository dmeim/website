import { useEffect, useRef, type HTMLAttributes, type MouseEvent, type ReactNode, type Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { bindNavMarker } from "@/ui/lib/nav-marker";
import type { SideNavItem, SideNavSection } from "@/ui/lib/side-nav";
import { Badge } from "./Badge";
import { Disclosure } from "./Disclosure";

export type { SideNavItem, SideNavSection };

export type SideNavProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  label: string;
  sections: SideNavSection[];
  header?: ReactNode;
  onNavigate?: (item: SideNavItem, event: MouseEvent<HTMLElement>) => void;
  onToggleSection?: (id: string, open: boolean) => void;
  ref?: Ref<HTMLElement>;
};

export function SideNav({ label, sections, header, onNavigate, onToggleSection, className, ref, ...rest }: SideNavProps) {
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const nav = navRef.current;
    return nav ? bindNavMarker(nav) : undefined;
  }, []);

  const setRef = (node: HTMLElement | null) => {
    navRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const renderItem = (item: SideNavItem) => {
    const content = (
      <>
        <span className="ui-side-nav__label">{item.label}</span>
        {item.badge && <Badge size="sm">{item.badge}</Badge>}
      </>
    );
    const common = {
      className: "ui-side-nav__link",
      "aria-current": item.current ? ("page" as const) : undefined,
      "data-item-id": item.id,
      "data-ui-marker-target": "",
      onClick: (event: MouseEvent<HTMLElement>) => onNavigate?.(item, event),
    };
    return (
      <li key={item.id} className="ui-side-nav__item">
        {item.href && !item.disabled ? (
          <a {...common} href={item.href}>{content}</a>
        ) : (
          <button {...common} type="button" disabled={item.disabled}>{content}</button>
        )}
      </li>
    );
  };

  return (
    <nav {...rest} ref={setRef} className={cx("ui-side-nav", className)} aria-label={label} data-ui-side-nav="">
      <span className="ui-nav-marker" data-axis="y" data-visible="false" aria-hidden="true" />
      {header != null && <div className="ui-side-nav__header">{header}</div>}
      {sections.map((section) => {
        const list = (
          <ul className="ui-side-nav__list" data-ui-marker-rail="">
            {section.items.map(renderItem)}
          </ul>
        );
        if (section.collapsible) {
          return (
            <Disclosure
              key={section.id}
              className="ui-side-nav__section"
              summary={section.title}
              meta={section.count}
              level="inline"
              data-section-id={section.id}
              {...(section.open === undefined ? { defaultOpen: true } : { open: section.open })}
              onToggle={(open) => onToggleSection?.(section.id, open)}
            >
              {list}
            </Disclosure>
          );
        }
        return (
          <div key={section.id} className="ui-side-nav__section" data-section-id={section.id}>
            <p className="ui-side-nav__title">
              <span>{section.title}</span>
              {section.count !== undefined && <span className="ui-side-nav__count">{section.count}</span>}
              {section.badge && <Badge size="sm">{section.badge}</Badge>}
            </p>
            {list}
          </div>
        );
      })}
    </nav>
  );
}

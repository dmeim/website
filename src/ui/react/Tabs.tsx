import { useLayoutEffect, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { Icon, type IslandIconName as IconName } from "@/ui/icons";
import { cx } from "@/ui/lib/cx";
import { useStableId } from "@/ui/lib/ids";
import { placeIndicator, tabForKey } from "@/ui/lib/tabs";

export type TabItem = { id: string; label: string; icon?: IconName; badge?: string; disabled?: boolean };

export type TabsProps = {
  label: string;
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  activation?: "auto" | "manual";
  renderPanel?: (id: string) => ReactNode;
  ref?: Ref<HTMLDivElement>;
} & Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue">;

export function Tabs({
  label,
  items,
  value,
  defaultValue,
  onChange,
  activation = "auto",
  renderPanel,
  className,
  id,
  ...rest
}: TabsProps) {
  const baseId = useStableId(id, "ui-tabs");
  const [inner, setInner] = useState(defaultValue ?? items.find((item) => !item.disabled)?.id);
  const selected = value ?? inner;
  const list = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (list.current) placeIndicator(list.current);
  }, [selected, items]);

  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const observer = new ResizeObserver(() => placeIndicator(el));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const select = (next: string) => {
    if (next === selected) return;
    if (value === undefined) setInner(next);
    onChange?.(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!list.current) return;
    const target = tabForKey(list.current, event.key);
    if (!target) return;
    event.preventDefault();
    target.focus();
    if (activation === "auto" && target.dataset.value) select(target.dataset.value);
  };

  return (
    <div id={id} {...rest} className={cx("ui-tabs", className)} data-activation={activation}>
      <div ref={list} className="ui-tabs__list" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
        {items.map((item) => {
          const on = item.id === selected;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              className="ui-tabs__tab"
              aria-selected={on}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={on ? 0 : -1}
              disabled={item.disabled}
              data-value={item.id}
              onClick={() => select(item.id)}
            >
              {item.icon && <Icon name={item.icon} weight={on ? "fill" : "regular"} className="ui-tabs__icon" />}
              <span>{item.label}</span>
              {item.badge && <span className="ui-tabs__badge">{item.badge}</span>}
            </button>
          );
        })}
        <span className="ui-tabs__indicator" aria-hidden="true" />
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          id={`${baseId}-panel-${item.id}`}
          className="ui-tabs__panel"
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${item.id}`}
          tabIndex={0}
          hidden={item.id !== selected}
        >
          {item.id === selected && renderPanel?.(item.id)}
        </div>
      ))}
    </div>
  );
}

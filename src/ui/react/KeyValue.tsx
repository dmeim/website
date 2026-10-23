import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { CopyButton } from "./CopyButton";

export type KeyValueItem = {
  label: string;
  value: ReactNode;
  mono?: boolean;
  copy?: boolean | string;
  tone?: "default" | "muted" | "success" | "danger";
  hint?: string;
};

export type KeyValueProps = HTMLAttributes<HTMLDListElement> & {
  items: KeyValueItem[];
  layout?: "rows" | "grid" | "inline";
  density?: "compact" | "normal";
  ref?: Ref<HTMLDListElement>;
};

function copyText(item: KeyValueItem): string | null {
  if (typeof item.copy === "string") return item.copy;
  if (!item.copy) return null;
  return typeof item.value === "string" || typeof item.value === "number" ? String(item.value) : null;
}

export function KeyValue({ items, layout = "rows", density = "normal", className, ...rest }: KeyValueProps) {
  return (
    <dl {...rest} className={cx("ui-key-value", className)} data-layout={layout} data-density={density}>
      {items.map((item, index) => {
        const text = copyText(item);
        return (
          <div className="ui-key-value__item" key={`${item.label}-${index}`} data-tone={item.tone ?? "default"}>
            <dt className="ui-key-value__label">{item.label}</dt>
            <dd className="ui-key-value__value">
              <span className="ui-key-value__text" data-mono={item.mono ? "true" : undefined}>{item.value}</span>
              {text !== null && (
                <CopyButton className="ui-key-value__copy" appearance="icon" size="sm" value={text} label={`Copy ${item.label}`} />
              )}
              {item.hint && <span className="ui-key-value__hint">{item.hint}</span>}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

import { useState, type DetailsHTMLAttributes, type ReactNode, type Ref } from "react";
import { Icon } from "@/ui/icons";
import { cx } from "@/ui/lib/cx";

export type DisclosureProps = Omit<DetailsHTMLAttributes<HTMLDetailsElement>, "onToggle" | "open"> & {
  summary: ReactNode;
  meta?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
  level?: "section" | "inline";
  ref?: Ref<HTMLDetailsElement>;
};

export function Disclosure({
  summary,
  meta,
  open,
  defaultOpen = false,
  onToggle,
  level = "section",
  className,
  children,
  ...rest
}: DisclosureProps) {
  const [inner, setInner] = useState(defaultOpen);
  const isOpen = open ?? inner;
  return (
    <details
      {...rest}
      className={cx("ui-disclosure", className)}
      data-level={level}
      open={isOpen}
      onToggle={(event) => {
        const next = event.currentTarget.open;
        if (next === isOpen) return;
        if (open === undefined) setInner(next);
        onToggle?.(next);
      }}
    >
      <summary className="ui-disclosure__summary">
        <span className="ui-disclosure__title">{summary}</span>
        {meta != null && <span className="ui-disclosure__meta">{meta}</span>}
        <Icon name="caret-down" className="ui-disclosure__caret" weight="bold" />
      </summary>
      <div className="ui-disclosure__body">{children}</div>
    </details>
  );
}

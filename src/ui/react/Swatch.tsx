import type { CSSProperties, HTMLAttributes, Ref } from "react";
import { cx } from "@/ui/lib/cx";

export type SwatchProps = Omit<HTMLAttributes<HTMLElement>, "color"> & {
  color: string;
  label?: string;
  code?: string;
  value?: string;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  as?: "div" | "button";
  ref?: Ref<HTMLElement>;
};

export function Swatch({ color, label, code, value, size = "md", selected = false, as = "div", className, style, ...rest }: SwatchProps) {
  const hasMeta = Boolean(label || code || value);
  const inner = (
    <>
      <span className="ui-swatch__chip" aria-hidden={hasMeta ? true : undefined} />
      {hasMeta && (
        <span className="ui-swatch__meta">
          {label && <span className="ui-swatch__label">{label}</span>}
          {code && <code className="ui-swatch__code">{code}</code>}
          {value && <span className="ui-swatch__value">{value}</span>}
        </span>
      )}
    </>
  );
  const shared = {
    className: cx("ui-swatch", className),
    "data-size": size,
    style: { "--ui-swatch-color": color, ...style } as CSSProperties,
  };
  if (as === "button") {
    return (
      <button type="button" aria-pressed={selected} {...shared} {...(rest as HTMLAttributes<HTMLButtonElement>)}>
        {inner}
      </button>
    );
  }
  return (
    <div data-selected={selected ? "true" : undefined} {...shared} {...(rest as HTMLAttributes<HTMLDivElement>)}>
      {inner}
    </div>
  );
}

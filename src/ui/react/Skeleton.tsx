import type { CSSProperties, HTMLAttributes, Ref } from "react";
import { cx } from "@/ui/lib/cx";

export type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  lines?: number;
  radius?: "control" | "panel" | "pill";
  ref?: Ref<HTMLSpanElement>;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children">;

const size = (v: string | number | undefined) => (typeof v === "number" ? `${v}px` : v);

export function Skeleton({ width, height, lines, radius = "control", className, style, ...rest }: SkeletonProps) {
  const vars = { ...style, "--ui-skeleton-w": size(width), "--ui-skeleton-h": size(height) } as CSSProperties;
  return (
    <span
      aria-hidden="true"
      {...rest}
      className={cx("ui-skeleton", className)}
      data-radius={radius}
      data-lines={lines ? "" : undefined}
      style={vars}
    >
      {lines ? Array.from({ length: lines }, (_, i) => <span key={i} className="ui-skeleton__line" />) : null}
    </span>
  );
}

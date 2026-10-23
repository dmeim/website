import type { CSSProperties, HTMLAttributes, Ref } from "react";
import { cx } from "@/ui/lib/cx";
import type { SpaceStep } from "@/ui/lib/space";

export type StackProps = HTMLAttributes<HTMLElement> & {
  gap?: SpaceStep;
  as?: "div" | "ul" | "ol" | "section" | "article" | "nav";
  align?: "start" | "center" | "end" | "stretch";
  ref?: Ref<HTMLElement>;
};

export function Stack({ gap, as: Tag = "div", align, className, ...rest }: StackProps) {
  return <Tag className={cx("ui-stack", className)} data-gap={gap} data-align={align} {...(rest as HTMLAttributes<HTMLElement>)} />;
}

export type ClusterProps = HTMLAttributes<HTMLDivElement> & {
  gap?: SpaceStep;
  align?: "start" | "center" | "end" | "baseline" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  wrap?: boolean;
  ref?: Ref<HTMLDivElement>;
};

export function Cluster({ gap, align, justify, wrap = true, className, ...rest }: ClusterProps) {
  return (
    <div
      className={cx("ui-cluster", className)}
      data-gap={gap}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap ? undefined : "false"}
      {...rest}
    />
  );
}

export type GridProps = HTMLAttributes<HTMLDivElement> & {
  min?: string;
  columns?: number;
  gap?: SpaceStep;
  ref?: Ref<HTMLDivElement>;
};

export function Grid({ min, columns, gap, className, style, ...rest }: GridProps) {
  const vars = {
    ...(min ? { "--ui-grid-min": min } : {}),
    ...(columns ? { "--ui-grid-columns": columns } : {}),
    ...style,
  } as CSSProperties;
  return <div className={cx("ui-grid", className)} data-gap={gap} data-columns={columns} style={vars} {...rest} />;
}

import type { HTMLAttributes, Ref } from "react";
import { cx } from "@/ui/lib/cx";

export type ContainerProps = HTMLAttributes<HTMLElement> & {
  width?: "narrow" | "default" | "wide" | "full";
  as?: "div" | "section" | "main" | "header" | "footer" | "article";
  ref?: Ref<HTMLElement>;
};

export function Container({ width = "default", as: Tag = "div", className, ...rest }: ContainerProps) {
  return <Tag className={cx("ui-container", className)} data-width={width} {...(rest as HTMLAttributes<HTMLElement>)} />;
}

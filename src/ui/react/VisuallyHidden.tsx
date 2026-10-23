import type { HTMLAttributes, Ref } from "react";
import { cx } from "@/ui/lib/cx";

export type VisuallyHiddenProps = HTMLAttributes<HTMLElement> & {
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3" | "label";
  ref?: Ref<HTMLElement>;
};

export function VisuallyHidden({ as: Tag = "span", className, ...rest }: VisuallyHiddenProps) {
  return <Tag className={cx("ui-visually-hidden", className)} {...(rest as HTMLAttributes<HTMLElement>)} />;
}

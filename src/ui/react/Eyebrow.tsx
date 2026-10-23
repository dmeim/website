import type { HTMLAttributes, Ref } from "react";
import { cx } from "@/ui/lib/cx";

export type EyebrowProps = HTMLAttributes<HTMLElement> & {
  as?: "p" | "span" | "div";
  ref?: Ref<HTMLElement>;
};

export function Eyebrow({ as: Tag = "p", className, ...rest }: EyebrowProps) {
  return <Tag className={cx("ui-eyebrow", className)} {...(rest as HTMLAttributes<HTMLElement>)} />;
}

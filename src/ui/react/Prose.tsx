import type { HTMLAttributes, Ref } from "react";
import { cx } from "@/ui/lib/cx";

export type ProseProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "article" | "section";
  size?: "sm" | "md";
  /** Trusted, pre-sanitised HTML. */
  html?: string;
  ref?: Ref<HTMLElement>;
};

export function Prose({ as: Tag = "div", size = "md", html, className, children, ...rest }: ProseProps) {
  const content = html !== undefined ? { dangerouslySetInnerHTML: { __html: html } } : { children };
  return <Tag className={cx("ui-prose", className)} data-size={size} {...(rest as HTMLAttributes<HTMLElement>)} {...content} />;
}

import type { ComponentPropsWithRef } from "react";
import { Icon } from "@/ui/icons";
import { cx } from "@/ui/lib/cx";

export type LinkProps = Omit<ComponentPropsWithRef<"a">, "href"> & {
  href: string;
  external?: boolean;
  arrow?: "none" | "right" | "up-right";
  tone?: "default" | "quiet" | "accent";
};

export function Link({ href, external = false, arrow = "none", tone = "default", className, children, ...rest }: LinkProps) {
  const arrowKind = arrow === "right" ? "right" : arrow === "up-right" || external ? "up-right" : null;
  return (
    <a
      className={cx("ui-link", className)}
      href={href}
      data-tone={tone}
      data-arrow={arrowKind ?? undefined}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {children}
      {arrowKind && <Icon name={arrowKind === "right" ? "arrow-right" : "arrow-up-right"} className="ui-link__arrow" />}
      {external && <span className="ui-visually-hidden"> (opens in new tab)</span>}
    </a>
  );
}

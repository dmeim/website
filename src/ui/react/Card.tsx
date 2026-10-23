import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/ui/lib/cx";

export type CardProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  as?: "div" | "article" | "section" | "li";
  href?: string;
  tone?: "default" | "inset";
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
  media?: ReactNode;
  eyebrow?: ReactNode;
  title?: ReactNode;
  footer?: ReactNode;
  ref?: Ref<HTMLElement>;
};

export function Card({
  as: Tag = "div",
  href,
  tone = "default",
  padding = "md",
  interactive,
  media,
  eyebrow,
  title,
  footer,
  className,
  children,
  ...rest
}: CardProps) {
  const isInteractive = Boolean(href) || Boolean(interactive);
  return (
    <Tag
      className={cx("ui-card", className)}
      data-tone={tone}
      data-padding={padding}
      data-interactive={isInteractive ? "true" : undefined}
      data-linked={href ? "true" : undefined}
      {...(rest as HTMLAttributes<HTMLElement>)}
    >
      {media && <div className="ui-card__media">{media}</div>}
      <div className="ui-card__body">
        {eyebrow && <p className="ui-card__eyebrow">{eyebrow}</p>}
        {title && (
          <p className="ui-card__title">
            {href ? <a className="ui-card__link" href={href}>{title}</a> : title}
          </p>
        )}
        {!title && href && <a className="ui-card__link" href={href} aria-label="Open" />}
        <div className="ui-card__content">{children}</div>
        {footer && <div className="ui-card__footer">{footer}</div>}
      </div>
    </Tag>
  );
}

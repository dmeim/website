import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { Eyebrow } from "./Eyebrow";
import { Cluster } from "./Stack";
import { Reveal } from "./Reveal";

export type PageHeaderProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  eyebrow?: ReactNode;
  title: string;
  titleId?: string;
  lede?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  align?: "start" | "center";
  reveal?: boolean;
  ref?: Ref<HTMLElement>;
};

const STEP = 0.04;

export function PageHeader({
  eyebrow,
  title,
  titleId,
  lede,
  meta,
  actions,
  align = "start",
  reveal = true,
  className,
  children,
  ...rest
}: PageHeaderProps) {
  const parts: ReactNode[] = [];
  if (eyebrow) parts.push(<Eyebrow key="eyebrow">{eyebrow}</Eyebrow>);
  parts.push(<h1 key="title" className="ui-page-header__title" id={titleId}>{title}</h1>);
  if (lede) parts.push(<p key="lede" className="ui-page-header__lede">{lede}</p>);
  if (meta) parts.push(<div key="meta" className="ui-page-header__meta">{meta}</div>);
  if (actions) parts.push(<Cluster key="actions" className="ui-page-header__actions">{actions}</Cluster>);

  return (
    <header className={cx("ui-page-header", className)} data-align={align} {...rest}>
      {reveal
        ? parts.map((part, i) => (
            <Reveal key={i} delay={i * STEP}>
              {part}
            </Reveal>
          ))
        : parts}
      {children}
    </header>
  );
}

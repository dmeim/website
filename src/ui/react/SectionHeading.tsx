import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/ui/lib/cx";

export type SectionHeadingProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  title: string;
  titleId?: string;
  description?: ReactNode;
  trailing?: ReactNode;
  level?: 2 | 3 | 4;
  ref?: Ref<HTMLDivElement>;
};

export function SectionHeading({ title, titleId, description, trailing, level = 2, className, ...rest }: SectionHeadingProps) {
  const Heading = `h${level}` as "h2" | "h3" | "h4";
  return (
    <div className={cx("ui-section-heading", className)} {...rest}>
      <div className="ui-section-heading__text">
        <Heading className="ui-section-heading__title" id={titleId}>{title}</Heading>
        {description && <p className="ui-section-heading__description">{description}</p>}
      </div>
      {trailing && <div className="ui-section-heading__trailing">{trailing}</div>}
    </div>
  );
}

import type { ReactNode } from "react";

import { cx } from "./cx";

type ToolSectionHeadingProps = {
  title: ReactNode;
  titleId?: string;
  /** Supporting line under the title (hint/status). */
  description?: ReactNode;
  /** Trailing content when `row` is true (e.g. Clear all). */
  trailing?: ReactNode;
  row?: boolean;
  className?: string;
  as?: "h2" | "h3";
};

export function ToolSectionHeading({
  title,
  titleId,
  description,
  trailing,
  row = false,
  className,
  as = "h2",
}: ToolSectionHeadingProps) {
  const Heading = as;

  return (
    <div className={cx("tool-section-heading", row && "tool-section-heading--row", className)}>
      <div className="tool-section-heading__copy">
        <Heading id={titleId}>{title}</Heading>
        {description}
      </div>
      {trailing}
    </div>
  );
}

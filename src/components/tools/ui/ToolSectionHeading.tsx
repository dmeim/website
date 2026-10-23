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

/**
 * Renders the library Panel header markup inside a ToolPanel body, so kit tools
 * get the Panel heading without restructuring their JSX.
 */
export function ToolSectionHeading({ title, titleId, description, trailing, className, as = "h2" }: ToolSectionHeadingProps) {
  const Heading = as;
  return (
    <header className={cx("ui-panel__header tool-section-heading", className)}>
      <div className="ui-panel__heading">
        <Heading id={titleId} className="ui-panel__title">
          {title}
        </Heading>
        {description ? <div className="ui-panel__description">{description}</div> : null}
      </div>
      {trailing ? <div className="ui-panel__actions">{trailing}</div> : null}
    </header>
  );
}

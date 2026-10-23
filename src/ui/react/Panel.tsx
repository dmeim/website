import { motion, useReducedMotion } from "framer-motion";
import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { useStableId } from "@/ui/lib/ids";
import { fadeUp } from "@/ui/lib/motion";

export type PanelProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  title?: string;
  titleId?: string;
  description?: ReactNode;
  headingLevel?: 2 | 3;
  actions?: ReactNode;
  animate?: boolean;
  ref?: Ref<HTMLElement>;
};

export function Panel({
  title,
  titleId,
  description,
  headingLevel = 2,
  actions,
  animate = true,
  className,
  children,
  ...rest
}: PanelProps) {
  const generated = useStableId(titleId, "panel");
  const headingId = title ? generated : titleId;
  const reduced = useReducedMotion();
  const Heading = headingLevel === 3 ? "h3" : "h2";

  const content = (
    <>
      {(title || description || actions) && (
        <header className="ui-panel__header">
          <div className="ui-panel__heading">
            {title && <Heading id={headingId} className="ui-panel__title">{title}</Heading>}
            {description && <p className="ui-panel__description">{description}</p>}
          </div>
          {actions && <div className="ui-panel__actions">{actions}</div>}
        </header>
      )}
      <div className="ui-panel__body">{children}</div>
    </>
  );

  const props = { ...rest, className: cx("ui-panel", className), "aria-labelledby": headingId };
  if (!animate || reduced) return <section {...props}>{content}</section>;
  return (
    <motion.section {...(props as object)} initial="hidden" animate="visible" variants={fadeUp}>
      {content}
    </motion.section>
  );
}

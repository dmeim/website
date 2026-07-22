import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { cx } from "./cx";
import { toolPanelReveal, toolPanelTransition } from "./motion";

type ToolPanelProps = {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  animate?: boolean;
  "aria-live"?: "off" | "polite" | "assertive";
};

export function ToolPanel({
  children,
  className,
  labelledBy,
  animate = true,
  "aria-live": ariaLive,
}: ToolPanelProps) {
  const reduced = useReducedMotion();
  const classes = cx("tool-panel", className);

  if (!animate || reduced) {
    return (
      <section className={classes} aria-labelledby={labelledBy} aria-live={ariaLive}>
        {children}
      </section>
    );
  }

  return (
    <motion.section
      className={classes}
      aria-labelledby={labelledBy}
      aria-live={ariaLive}
      initial="hidden"
      animate="visible"
      variants={toolPanelReveal}
      transition={toolPanelTransition}
    >
      {children}
    </motion.section>
  );
}

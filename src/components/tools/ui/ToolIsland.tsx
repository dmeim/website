import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { cx } from "./cx";
import { toolFadeUp, toolTransition } from "./motion";

type ToolIslandProps = {
  children: ReactNode;
  className?: string;
  /** When true, fade the island in once on mount. */
  animate?: boolean;
};

export function ToolIsland({ children, className, animate = true }: ToolIslandProps) {
  const reduced = useReducedMotion();
  const classes = cx("tool-island", className);

  if (!animate || reduced) {
    return <div className={classes}>{children}</div>;
  }

  return (
    <motion.div
      className={classes}
      initial="hidden"
      animate="visible"
      variants={toolFadeUp}
      transition={toolTransition}
    >
      {children}
    </motion.div>
  );
}

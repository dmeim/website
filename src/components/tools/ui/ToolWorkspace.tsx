import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { cx } from "./cx";
import { toolStagger } from "./motion";

type ToolWorkspaceProps = {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
};

export function ToolWorkspace({
  children,
  className,
  stagger = false,
}: ToolWorkspaceProps) {
  const reduced = useReducedMotion();
  const classes = cx("tool-workspace", className);

  if (!stagger || reduced) {
    return <div className={classes}>{children}</div>;
  }

  return (
    <motion.div
      className={classes}
      initial="hidden"
      animate="visible"
      variants={toolStagger}
    >
      {children}
    </motion.div>
  );
}

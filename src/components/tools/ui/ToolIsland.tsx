import type { ReactNode } from "react";
import { ToolFrame } from "@/ui/react";

import { cx } from "./cx";

type ToolIslandProps = {
  children: ReactNode;
  className?: string;
  /** Kept for API compatibility; panels carry their own reveal. */
  animate?: boolean;
};

export function ToolIsland({ children, className }: ToolIslandProps) {
  return (
    <ToolFrame layout="stack" className={cx("tool-island", className)}>
      {children}
    </ToolFrame>
  );
}

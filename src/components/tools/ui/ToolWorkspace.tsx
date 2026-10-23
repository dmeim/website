import type { ReactNode } from "react";
import { ToolFrame } from "@/ui/react";

import { cx } from "./cx";

type ToolWorkspaceProps = {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
};

export function ToolWorkspace({ children, className, stagger = false }: ToolWorkspaceProps) {
  return (
    <ToolFrame layout="split" stagger={stagger} className={cx("tool-workspace", className)}>
      {children}
    </ToolFrame>
  );
}

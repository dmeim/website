import type { ReactNode } from "react";
import { Panel } from "@/ui/react";

import { cx } from "./cx";

type ToolPanelProps = {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  animate?: boolean;
  "aria-live"?: "off" | "polite" | "assertive";
};

export function ToolPanel({ children, className, labelledBy, animate = true, "aria-live": ariaLive }: ToolPanelProps) {
  return (
    <Panel className={cx("tool-panel", className)} titleId={labelledBy} animate={animate} aria-live={ariaLive}>
      {children}
    </Panel>
  );
}

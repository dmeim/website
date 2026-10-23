import type { AriaRole, ReactNode } from "react";
import { EmptyState, Notice, type NoticeTone } from "@/ui/react";

import { cx } from "./cx";

export type ToolStatusTone = "default" | "success" | "error" | "accent" | "";

type ToolStatusProps = {
  children: ReactNode;
  tone?: ToolStatusTone;
  className?: string;
  live?: "polite" | "assertive" | "off";
  role?: string;
};

const TONES: Record<ToolStatusTone, NoticeTone> = {
  "": "neutral",
  default: "neutral",
  success: "success",
  error: "danger",
  accent: "accent",
};

const isEmpty = (node: ReactNode) => node == null || node === false || node === "";

export function ToolStatus({ children, tone = "default", className, live = "polite", role = "status" }: ToolStatusProps) {
  const noticeTone = TONES[tone];
  return (
    <Notice
      className={cx("tool-status", className)}
      tone={noticeTone}
      live={live}
      role={role as AriaRole}
      icon={noticeTone === "neutral" || isEmpty(children) ? false : undefined}
    >
      {children}
    </Notice>
  );
}

type ToolHintProps = {
  children: ReactNode;
  className?: string;
};

export function ToolHint({ children, className }: ToolHintProps) {
  return (
    <Notice className={cx("tool-hint", className)} tone="neutral" live="off" icon={false}>
      {children}
    </Notice>
  );
}

type ToolEmptyProps = {
  children: ReactNode;
  className?: string;
};

export function ToolEmpty({ children, className }: ToolEmptyProps) {
  return <EmptyState className={cx("tool-empty", className)} size="sm" title={children as string} />;
}

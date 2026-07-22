import type { ReactNode } from "react";

import { cx } from "./cx";

export type ToolStatusTone = "default" | "success" | "error" | "accent" | "";

type ToolStatusProps = {
  children: ReactNode;
  tone?: ToolStatusTone;
  className?: string;
  live?: "polite" | "assertive" | "off";
  role?: string;
};

export function ToolStatus({
  children,
  tone = "default",
  className,
  live = "polite",
  role = "status",
}: ToolStatusProps) {
  const resolvedTone = tone === "default" || tone === "" ? undefined : tone;

  return (
    <p
      className={cx(
        "tool-status",
        resolvedTone === "success" && "tool-status--success",
        resolvedTone === "error" && "tool-status--error",
        resolvedTone === "accent" && "tool-status--accent",
        className,
      )}
      role={role}
      aria-live={live === "off" ? undefined : live}
    >
      {children}
    </p>
  );
}

type ToolHintProps = {
  children: ReactNode;
  className?: string;
};

export function ToolHint({ children, className }: ToolHintProps) {
  return <p className={cx("tool-hint", className)}>{children}</p>;
}

type ToolEmptyProps = {
  children: ReactNode;
  className?: string;
};

export function ToolEmpty({ children, className }: ToolEmptyProps) {
  return <p className={cx("tool-empty", className)}>{children}</p>;
}

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button, ButtonGroup, type ButtonProps, type ButtonVariant } from "@/ui/react";

import { cx } from "./cx";

type ToolActionRowProps = {
  children: ReactNode;
  className?: string;
  /** Kept for API compatibility; the row no longer animates on its own. */
  animate?: boolean;
  "aria-label"?: string;
};

export function ToolActionRow({ children, className, "aria-label": ariaLabel }: ToolActionRowProps) {
  return (
    <ButtonGroup className={cx("tool-actions", className)} label={ariaLabel}>
      {children}
    </ButtonGroup>
  );
}

type ToolButtonVariant = "primary" | "ghost" | "danger" | "default";

type ToolButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ToolButtonVariant;
};

const VARIANTS: Record<ToolButtonVariant, ButtonVariant> = {
  default: "secondary",
  primary: "primary",
  ghost: "ghost",
  danger: "danger",
};

export function ToolButton({ variant = "default", type = "button", ...rest }: ToolButtonProps) {
  return <Button {...(rest as ButtonProps)} type={type as ButtonProps["type"]} variant={VARIANTS[variant]} />;
}

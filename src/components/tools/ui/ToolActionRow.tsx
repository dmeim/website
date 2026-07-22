import { motion, useReducedMotion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "./cx";
import { toolFadeUp, toolTransition } from "./motion";

type ToolActionRowProps = {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  "aria-label"?: string;
};

export function ToolActionRow({
  children,
  className,
  animate = false,
  "aria-label": ariaLabel,
}: ToolActionRowProps) {
  const reduced = useReducedMotion();
  const classes = cx("tool-actions", className);

  if (!animate || reduced) {
    return (
      <div className={classes} aria-label={ariaLabel}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={classes}
      aria-label={ariaLabel}
      initial="hidden"
      animate="visible"
      variants={toolFadeUp}
      transition={toolTransition}
    >
      {children}
    </motion.div>
  );
}

type ToolButtonVariant = "primary" | "ghost" | "danger" | "default";

type ToolButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ToolButtonVariant;
};

export function ToolButton({
  variant = "default",
  className,
  type = "button",
  children,
  ...rest
}: ToolButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "btn",
        variant === "primary" && "btn--primary",
        variant === "ghost" && "btn--ghost",
        variant === "danger" && "tool-btn--danger",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

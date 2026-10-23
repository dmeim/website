import type { ComponentPropsWithRef } from "react";
import { Icon, type IconName } from "@/ui/icons";
import { cx } from "@/ui/lib/cx";

export type BadgeProps = ComponentPropsWithRef<"span"> & {
  tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "info";
  variant?: "soft" | "outline" | "solid";
  size?: "sm" | "md";
  icon?: IconName;
};

export function Badge({ tone = "neutral", variant = "soft", size = "md", icon, className, children, ...rest }: BadgeProps) {
  return (
    <span className={cx("ui-badge", className)} data-tone={tone} data-variant={variant} data-size={size} {...rest}>
      {icon && <Icon name={icon} weight="bold" className="ui-badge__icon" />}
      {children}
    </span>
  );
}

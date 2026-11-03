import type { AnchorHTMLAttributes, ButtonHTMLAttributes, Ref } from "react";
import { Icon, type IslandIconName as IconName, type IconWeight } from "@/ui/icons";
import { cx } from "@/ui/lib/cx";
import { Tooltip } from "./Tooltip";

type SharedAttrs = Omit<
  ButtonHTMLAttributes<HTMLButtonElement> & AnchorHTMLAttributes<HTMLAnchorElement>,
  "type" | "children" | "aria-label"
>;

export type IconButtonProps = {
  icon: IconName;
  label: string;
  variant?: "ghost" | "secondary" | "primary" | "danger";
  size?: "sm" | "md" | "lg";
  pressed?: boolean;
  href?: string;
  tooltip?: boolean;
  iconWeight?: IconWeight;
  type?: "button" | "submit" | "reset";
  ref?: Ref<HTMLButtonElement & HTMLAnchorElement>;
} & SharedAttrs;

export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  pressed,
  href,
  tooltip = true,
  iconWeight,
  type = "button",
  disabled,
  className,
  ref,
  ...rest
}: IconButtonProps) {
  const common = {
    className: cx("ui-icon-button", className),
    "data-variant": variant,
    "data-size": size,
    "aria-label": label,
    "aria-pressed": pressed,
  };
  const glyph = (
    <Icon name={icon} weight={iconWeight ?? (pressed ? "fill" : "regular")} className="ui-icon-button__icon" />
  );
  const control =
    href !== undefined ? (
      <a ref={ref} {...rest} {...common} href={disabled ? undefined : href} aria-disabled={disabled || undefined}>
        {glyph}
      </a>
    ) : (
      <button ref={ref} {...rest} {...common} type={type} disabled={disabled}>
        {glyph}
      </button>
    );
  return tooltip ? <Tooltip content={label}>{control}</Tooltip> : control;
}

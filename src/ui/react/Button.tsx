import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from "react";
import { Icon, type IconName } from "@/ui/icons";
import { cx } from "@/ui/lib/cx";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type SharedAttrs = Omit<ButtonHTMLAttributes<HTMLButtonElement> & AnchorHTMLAttributes<HTMLAnchorElement>, "type">;

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  iconStart?: IconName;
  iconEnd?: IconName;
  loading?: boolean;
  pressed?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  children?: ReactNode;
  ref?: Ref<HTMLButtonElement & HTMLAnchorElement>;
} & SharedAttrs;

export function Button({
  variant = "secondary",
  size = "md",
  href,
  iconStart,
  iconEnd,
  loading = false,
  pressed,
  fullWidth = false,
  type = "button",
  disabled = false,
  className,
  children,
  onClick,
  ref,
  ...rest
}: ButtonProps) {
  const common = {
    className: cx("ui-button", className),
    "data-variant": variant,
    "data-size": size,
    "data-full-width": fullWidth ? "" : undefined,
    "aria-busy": loading || undefined,
    "aria-pressed": pressed,
    onClick: (event: MouseEvent<HTMLButtonElement & HTMLAnchorElement>) => {
      if (loading || (href !== undefined && disabled)) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    },
  };
  const content = (
    <>
      {iconStart && <Icon name={iconStart} weight={pressed ? "fill" : undefined} className="ui-button__icon" />}
      {children !== undefined && <span className="ui-button__label">{children}</span>}
      {iconEnd && <Icon name={iconEnd} className="ui-button__icon" />}
      {loading && <Spinner size="sm" className="ui-button__spinner" />}
    </>
  );

  if (href !== undefined) {
    return (
      <a ref={ref} {...rest} {...common} href={disabled ? undefined : href} aria-disabled={disabled || undefined}>
        {content}
      </a>
    );
  }
  return (
    <button ref={ref} {...rest} {...common} type={type} disabled={disabled}>
      {content}
    </button>
  );
}

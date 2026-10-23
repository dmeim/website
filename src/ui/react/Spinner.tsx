import type { HTMLAttributes, Ref } from "react";
import { Icon } from "@/ui/icons";
import { cx } from "@/ui/lib/cx";

export type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  label?: string;
  ref?: Ref<HTMLSpanElement>;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children">;

export function Spinner({ size = "md", label = "Loading", className, ...rest }: SpinnerProps) {
  return (
    <span className={cx("ui-spinner", className)} data-size={size} {...rest}>
      <Icon name="circle-notch" weight="bold" className="ui-spinner__icon" />
      <span className="ui-visually-hidden">{label}</span>
    </span>
  );
}

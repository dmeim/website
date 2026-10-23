import type { HTMLAttributes, Ref } from "react";
import { cx } from "@/ui/lib/cx";

export type ButtonGroupProps = {
  align?: "start" | "end" | "between" | "stretch";
  wrap?: boolean;
  attached?: boolean;
  label?: string;
  ref?: Ref<HTMLDivElement>;
} & HTMLAttributes<HTMLDivElement>;

export function ButtonGroup({
  align = "start",
  wrap = true,
  attached = false,
  label,
  className,
  children,
  ...rest
}: ButtonGroupProps) {
  return (
    <div
      role={label ? "group" : undefined}
      aria-label={label}
      {...rest}
      className={cx("ui-button-group", className)}
      data-align={align}
      data-wrap={wrap ? undefined : "false"}
      data-attached={attached ? "" : undefined}
    >
      {children}
    </div>
  );
}

import type { ComponentPropsWithRef } from "react";
import { cx } from "@/ui/lib/cx";

export type StatusDotProps = ComponentPropsWithRef<"span"> & {
  status: "live" | "wip" | "archived" | "idle" | "busy" | "success" | "error";
  pulse?: boolean;
  label?: string;
  labelHidden?: boolean;
};

export function StatusDot({ status, pulse, label, labelHidden = false, className, ...rest }: StatusDotProps) {
  const pulsing = pulse ?? (status === "live" || status === "busy");
  const showLabel = Boolean(label) && !labelHidden;
  const a11y = showLabel ? {} : { role: "img", "aria-label": label || status };
  return (
    <span className={cx("ui-status-dot", className)} data-status={status} data-pulse={pulsing ? "true" : undefined} {...a11y} {...rest}>
      <span className="ui-status-dot__dot" aria-hidden="true" />
      {showLabel && <span className="ui-status-dot__label">{label}</span>}
    </span>
  );
}

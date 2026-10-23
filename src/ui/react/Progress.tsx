import type { CSSProperties, HTMLAttributes, Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { useStableId } from "@/ui/lib/ids";
import type { Tone } from "@/ui/lib/tone-icons";

export type ProgressProps = {
  value?: number;
  max?: number;
  indeterminate?: boolean;
  label: string;
  labelHidden?: boolean;
  size?: "sm" | "md";
  /** Countdown mode in ms: the fill empties over this time. Restart by changing the `key`. */
  duration?: number;
  tone?: Tone;
  ref?: Ref<HTMLDivElement>;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

export function Progress({
  value,
  max = 100,
  indeterminate = false,
  label,
  labelHidden = false,
  size = "md",
  duration,
  tone,
  className,
  id,
  style,
  ...rest
}: ProgressProps) {
  const labelId = `${useStableId(id, "ui-progress")}-label`;
  const mode = duration !== undefined ? "countdown" : indeterminate || value === undefined ? "indeterminate" : "value";
  const ratio = mode === "value" ? Math.min(1, Math.max(0, (value ?? 0) / max)) : 1;
  const vars = {
    ...style,
    "--ui-progress": ratio,
    "--ui-progress-duration": duration !== undefined ? `${duration}ms` : undefined,
  } as CSSProperties;
  return (
    <div
      id={id}
      {...rest}
      className={cx("ui-progress", className)}
      data-size={size}
      data-tone={tone}
      data-mode={mode}
      style={vars}
    >
      <span id={labelId} className={labelHidden ? "ui-visually-hidden" : "ui-progress__label"}>
        {label}
      </span>
      <div
        className="ui-progress__track"
        role="progressbar"
        aria-labelledby={labelId}
        aria-valuemin={mode === "value" ? 0 : undefined}
        aria-valuemax={mode === "value" ? max : undefined}
        aria-valuenow={mode === "value" ? value : undefined}
      >
        <span key={duration} className="ui-progress__fill" />
      </div>
    </div>
  );
}

import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { useStableId } from "@/ui/lib/ids";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size" | "role"> {
  label: ReactNode;
  description?: ReactNode;
  invalid?: boolean;
  labelHidden?: boolean;
  labelPosition?: "start" | "end";
  ref?: Ref<HTMLInputElement>;
}

export function Switch({
  label,
  description,
  invalid,
  labelHidden,
  labelPosition = "end",
  id,
  className,
  "aria-describedby": ariaDescribedBy,
  ...rest
}: SwitchProps) {
  const controlId = useStableId(id, "switch");
  const descId = description ? `${controlId}-description` : undefined;
  return (
    <label
      className={cx("ui-switch", className)}
      htmlFor={controlId}
      data-label-position={labelPosition}
      data-invalid={invalid ? "true" : undefined}
    >
      <input
        {...rest}
        id={controlId}
        type="checkbox"
        role="switch"
        className="ui-switch__input"
        aria-invalid={invalid ? true : undefined}
        aria-describedby={[ariaDescribedBy, descId].filter(Boolean).join(" ") || undefined}
      />
      <span className={cx("ui-switch__text", labelHidden && "ui-visually-hidden")}>
        <span className="ui-switch__label">{label}</span>
        {description && (
          <span className="ui-switch__description" id={descId}>
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

import { useEffect, useRef, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { useStableId } from "@/ui/lib/ids";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label: ReactNode;
  description?: ReactNode;
  indeterminate?: boolean;
  invalid?: boolean;
  labelHidden?: boolean;
  ref?: Ref<HTMLInputElement>;
}

function assignRef<T>(ref: Ref<T> | undefined, node: T | null): void {
  if (typeof ref === "function") ref(node);
  else if (ref) (ref as { current: T | null }).current = node;
}

export function Checkbox({
  label,
  description,
  indeterminate,
  invalid,
  labelHidden,
  id,
  className,
  ref,
  "aria-describedby": ariaDescribedBy,
  ...rest
}: CheckboxProps) {
  const controlId = useStableId(id, "checkbox");
  const inner = useRef<HTMLInputElement | null>(null);
  const descId = description ? `${controlId}-description` : undefined;

  useEffect(() => {
    if (inner.current) inner.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);

  return (
    <label className={cx("ui-checkbox", className)} htmlFor={controlId} data-invalid={invalid ? "true" : undefined}>
      <input
        {...rest}
        ref={(node) => {
          inner.current = node;
          assignRef(ref, node);
        }}
        id={controlId}
        type="checkbox"
        className="ui-checkbox__input"
        aria-invalid={invalid ? true : undefined}
        aria-describedby={[ariaDescribedBy, descId].filter(Boolean).join(" ") || undefined}
      />
      <span className={cx("ui-checkbox__text", labelHidden && "ui-visually-hidden")}>
        <span className="ui-checkbox__label">{label}</span>
        {description && (
          <span className="ui-checkbox__description" id={descId}>
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

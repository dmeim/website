import { useRef, useState, type ChangeEvent, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { Icon, type IslandIconName as IconName } from "@/ui/icons";
import { cx } from "@/ui/lib/cx";
import { describedBy, type ControlSize } from "@/ui/lib/field";
import { useStableId } from "@/ui/lib/ids";
import { withField, type FieldOwnProps } from "./Field";

export interface InputProps
  extends FieldOwnProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  size?: ControlSize;
  mono?: boolean;
  iconStart?: IconName;
  suffix?: ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  revealable?: boolean;
  ref?: Ref<HTMLInputElement>;
}

function assignRef<T>(ref: Ref<T> | undefined, node: T | null): void {
  if (typeof ref === "function") ref(node);
  else if (ref) (ref as { current: T | null }).current = node;
}

/** Sets the value so React's onChange still fires (native setter + input event). */
function clearNative(input: HTMLInputElement): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, "");
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

export function Input({
  label,
  hint,
  error,
  required,
  optional,
  labelHidden,
  layout,
  span,
  trailing,
  size = "md",
  mono,
  iconStart,
  suffix,
  clearable,
  onClear,
  revealable,
  id,
  type = "text",
  className,
  ref,
  onChange,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...rest
}: InputProps) {
  const controlId = useStableId(id, "input");
  const inner = useRef<HTMLInputElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const initial = rest.value ?? rest.defaultValue;
  const [filledState, setFilled] = useState(initial !== undefined && String(initial) !== "");
  const filled = rest.value !== undefined ? String(rest.value) !== "" : filledState;
  const showClear = (clearable ?? type === "search") && !rest.disabled && !rest.readOnly;
  const isPassword = type === "password";

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilled(event.target.value !== "");
    onChange?.(event);
  };

  const handleClear = () => {
    const input = inner.current;
    if (!input) return;
    clearNative(input);
    setFilled(false);
    onClear?.();
    input.focus();
  };

  const control = (
    <span
      className={cx("ui-input", className)}
      data-size={size}
      data-mono={mono ? "true" : undefined}
      data-filled={filled ? "true" : undefined}
    >
      {iconStart && <Icon name={iconStart} className="ui-input__icon" />}
      <input
        {...rest}
        ref={(node) => {
          inner.current = node;
          assignRef(ref, node);
        }}
        id={controlId}
        type={isPassword && revealable && revealed ? "text" : type}
        required={required}
        className="ui-input__control"
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={describedBy(controlId, hint, error, ariaDescribedBy)}
        onChange={handleChange}
      />
      {suffix != null && <span className="ui-input__suffix">{suffix}</span>}
      {showClear && (
        <button type="button" className="ui-input__action ui-input__clear" aria-label="Clear" onClick={handleClear}>
          <Icon name="x" weight="bold" />
        </button>
      )}
      {revealable && isPassword && (
        <button
          type="button"
          className="ui-input__action"
          aria-label={revealed ? "Hide password" : "Show password"}
          aria-pressed={revealed}
          onClick={() => setRevealed((value) => !value)}
          disabled={rest.disabled}
        >
          <Icon name={revealed ? "eye-slash" : "eye"} />
        </button>
      )}
    </span>
  );

  return withField(controlId, { label, hint, error, required, optional, labelHidden, layout, span, trailing }, control);
}

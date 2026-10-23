import type { ReactNode, Ref, SelectHTMLAttributes } from "react";
import { Icon } from "@/ui/icons";
import { cx } from "@/ui/lib/cx";
import { describedBy, type ControlSize } from "@/ui/lib/field";
import { useStableId } from "@/ui/lib/ids";
import { withField, type FieldOwnProps } from "./Field";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface SelectProps extends FieldOwnProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  size?: ControlSize;
  options?: SelectOption[];
  children?: ReactNode;
  ref?: Ref<HTMLSelectElement>;
}

/** Groups options by `group`, keeping first-seen order. */
export function groupOptions(options: SelectOption[]): Array<{ group?: string; items: SelectOption[] }> {
  const out: Array<{ group?: string; items: SelectOption[] }> = [];
  for (const option of options) {
    const last = out[out.length - 1];
    if (last && last.group === option.group) last.items.push(option);
    else out.push({ group: option.group, items: [option] });
  }
  return out;
}

export function Select({
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
  options,
  children,
  id,
  className,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...rest
}: SelectProps) {
  const controlId = useStableId(id, "select");
  const renderOption = (option: SelectOption) => (
    <option key={option.value} value={option.value} disabled={option.disabled}>
      {option.label}
    </option>
  );

  const control = (
    <span className={cx("ui-select", className)} data-size={size}>
      <select
        {...rest}
        id={controlId}
        required={required}
        className="ui-select__control"
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={describedBy(controlId, hint, error, ariaDescribedBy)}
      >
        {options
          ? groupOptions(options).map((chunk, index) =>
              chunk.group ? (
                <optgroup key={`${chunk.group}-${index}`} label={chunk.group}>
                  {chunk.items.map(renderOption)}
                </optgroup>
              ) : (
                chunk.items.map(renderOption)
              ),
            )
          : children}
      </select>
      <Icon name="caret-down" className="ui-select__caret" />
    </span>
  );

  return withField(controlId, { label, hint, error, required, optional, labelHidden, layout, span, trailing }, control);
}

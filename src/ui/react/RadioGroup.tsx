import type { FieldsetHTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { useStableId } from "@/ui/lib/ids";

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "onChange"> {
  name: string;
  legend: string;
  legendHidden?: boolean;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  orientation?: "vertical" | "horizontal";
  ref?: Ref<HTMLFieldSetElement>;
}

export function RadioGroup({
  name,
  legend,
  legendHidden,
  options,
  value,
  defaultValue,
  onChange,
  orientation = "vertical",
  id,
  className,
  ...rest
}: RadioGroupProps) {
  const baseId = useStableId(id, "radio");
  return (
    <fieldset {...rest} id={id} className={cx("ui-radio-group", className)} data-orientation={orientation}>
      <legend className={cx("ui-radio-group__legend", legendHidden && "ui-visually-hidden")}>{legend}</legend>
      <div className="ui-radio-group__options">
        {options.map((option, index) => {
          const optionId = `${baseId}-${index}`;
          const descId = option.description ? `${optionId}-description` : undefined;
          return (
            <label key={option.value} className="ui-radio-group__option" htmlFor={optionId}>
              <input
                id={optionId}
                type="radio"
                className="ui-radio-group__input"
                name={name}
                value={option.value}
                disabled={option.disabled}
                aria-describedby={descId}
                {...(value !== undefined
                  ? { checked: value === option.value }
                  : { defaultChecked: defaultValue === option.value })}
                onChange={(event) => event.target.checked && onChange?.(option.value)}
              />
              <span className="ui-radio-group__text">
                <span className="ui-radio-group__label">{option.label}</span>
                {option.description && (
                  <span className="ui-radio-group__description" id={descId}>
                    {option.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

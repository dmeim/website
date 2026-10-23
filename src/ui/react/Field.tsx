import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { fieldErrorId, fieldHintId, type FieldLayout, type FieldSpan } from "@/ui/lib/field";

/** Field props shared by every field control (spec §4.3). */
export interface FieldOwnProps {
  label?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  optional?: boolean;
  labelHidden?: boolean;
  layout?: FieldLayout;
  span?: FieldSpan;
  trailing?: ReactNode;
}

export interface FieldProps extends FieldOwnProps, Omit<HTMLAttributes<HTMLDivElement>, "id"> {
  /** Id of the control the label points at. */
  htmlFor?: string;
  id?: string;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

export function Field({
  label,
  htmlFor,
  id,
  hint,
  error,
  required,
  optional,
  labelHidden,
  layout = "stack",
  span = "auto",
  trailing,
  className,
  children,
  ...rest
}: FieldProps) {
  const controlId = htmlFor ?? id;
  return (
    <div
      {...rest}
      className={cx("ui-field", className)}
      data-layout={layout}
      data-span={span}
      data-invalid={error ? "true" : undefined}
    >
      {(label || trailing) && (
        <div className="ui-field__head">
          {label && (
            <label className={cx("ui-field__label", labelHidden && "ui-visually-hidden")} htmlFor={controlId}>
              {label}
              {required && (
                <span className="ui-field__required" aria-hidden="true">
                  *
                </span>
              )}
              {optional && !required && <span className="ui-field__optional">optional</span>}
            </label>
          )}
          {trailing && <div className="ui-field__trailing">{trailing}</div>}
        </div>
      )}
      <div className="ui-field__control">{children}</div>
      {hint && (
        <p className="ui-field__hint" id={controlId ? fieldHintId(controlId) : undefined}>
          {hint}
        </p>
      )}
      {error && (
        <p className="ui-field__error" id={controlId ? fieldErrorId(controlId) : undefined}>
          {error}
        </p>
      )}
    </div>
  );
}

/** Wraps a control in a Field when it has label, hint or error. */
export function withField(id: string, props: FieldOwnProps, control: ReactNode): ReactNode {
  const { label, hint, error } = props;
  if (!label && !hint && !error) return control;
  return (
    <Field htmlFor={id} {...props}>
      {control}
    </Field>
  );
}

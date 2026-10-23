import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Field, Input, Select, Textarea } from "@/ui/react";

import { cx } from "./cx";

type ToolFieldShellProps = {
  label?: ReactNode;
  htmlFor?: string;
  full?: boolean;
  className?: string;
  children: ReactNode;
};

/** The kit accepts node labels; the library renders them inside its <label> unchanged. */
const asLabel = (label: ReactNode) => label as string | undefined;

export function ToolField({ label, htmlFor, full = false, className, children }: ToolFieldShellProps) {
  return (
    <Field
      label={asLabel(label)}
      htmlFor={htmlFor}
      span={full ? "full" : "auto"}
      className={cx("tool-field", className)}
    >
      {children}
    </Field>
  );
}

type ToolInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: ReactNode;
  full?: boolean;
  fieldClassName?: string;
  size?: number;
  code?: boolean;
};

export function ToolInput({ label, full, fieldClassName, size: _size, code = false, ...rest }: ToolInputProps) {
  return (
    <Field label={asLabel(label)} htmlFor={rest.id} span={full ? "full" : "auto"} className={cx("tool-field", fieldClassName)}>
      <Input {...rest} mono={code} />
    </Field>
  );
}

type ToolSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  label: ReactNode;
  full?: boolean;
  fieldClassName?: string;
  children: ReactNode;
  size?: number;
};

export function ToolSelect({ label, full, fieldClassName, children, size: _size, ...rest }: ToolSelectProps) {
  return (
    <Field label={asLabel(label)} htmlFor={rest.id} span={full ? "full" : "auto"} className={cx("tool-field", fieldClassName)}>
      <Select {...rest}>{children}</Select>
    </Field>
  );
}

type ToolTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode;
  full?: boolean;
  code?: boolean;
  fieldClassName?: string;
};

export function ToolTextarea({ label, full, code = false, fieldClassName, ...rest }: ToolTextareaProps) {
  return (
    <Field label={asLabel(label)} htmlFor={rest.id} span={full ? "full" : "auto"} className={cx("tool-field", fieldClassName)}>
      <Textarea {...rest} mono={code} />
    </Field>
  );
}

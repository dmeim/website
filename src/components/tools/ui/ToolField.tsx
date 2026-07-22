import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cx } from "./cx";

type ToolFieldShellProps = {
  label?: ReactNode;
  htmlFor?: string;
  full?: boolean;
  className?: string;
  children: ReactNode;
};

export function ToolField({
  label,
  htmlFor,
  full = false,
  className,
  children,
}: ToolFieldShellProps) {
  return (
    <div className={cx("tool-field", full && "tool-field--full", className)}>
      {label ? <label htmlFor={htmlFor}>{label}</label> : null}
      {children}
    </div>
  );
}

type ToolInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  full?: boolean;
  fieldClassName?: string;
};

export function ToolInput({
  label,
  id,
  full,
  fieldClassName,
  className,
  ...rest
}: ToolInputProps) {
  return (
    <ToolField label={label} htmlFor={id} full={full} className={fieldClassName}>
      <input id={id} className={className} {...rest} />
    </ToolField>
  );
}

type ToolSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: ReactNode;
  full?: boolean;
  fieldClassName?: string;
  children: ReactNode;
};

export function ToolSelect({
  label,
  id,
  full,
  fieldClassName,
  className,
  children,
  ...rest
}: ToolSelectProps) {
  return (
    <ToolField label={label} htmlFor={id} full={full} className={fieldClassName}>
      <select id={id} className={className} {...rest}>
        {children}
      </select>
    </ToolField>
  );
}

type ToolTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode;
  full?: boolean;
  code?: boolean;
  fieldClassName?: string;
};

export function ToolTextarea({
  label,
  id,
  full,
  code = false,
  fieldClassName,
  className,
  ...rest
}: ToolTextareaProps) {
  return (
    <ToolField label={label} htmlFor={id} full={full} className={fieldClassName}>
      <textarea id={id} className={cx(code && "tool-code", className)} {...rest} />
    </ToolField>
  );
}

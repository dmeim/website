import type { ReactNode } from "react";
import { CopyButton } from "./CopyButton";
import { Input } from "./Input";
import { Textarea } from "./Textarea";

export type OutputFieldProps = {
  label: string;
  value: string;
  multiline?: boolean;
  rows?: number;
  mono?: boolean;
  copy?: boolean;
  placeholder?: string;
  hint?: ReactNode;
  error?: ReactNode;
  id?: string;
  className?: string;
};

export function OutputField({ label, value, multiline, rows, mono = true, copy = true, placeholder, hint, error, id, className }: OutputFieldProps) {
  const trailing = copy ? <CopyButton value={value} appearance="icon" size="sm" disabled={!value} /> : undefined;
  const shared = { label, value, mono, placeholder, hint, error, id, trailing, readOnly: true, spellCheck: false };
  return (
    <div className={className ? `ui-output-field ${className}` : "ui-output-field"}>
      {multiline ? <Textarea {...shared} rows={rows ?? 4} /> : <Input {...shared} />}
    </div>
  );
}

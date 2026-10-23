import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { CopyButton } from "./CopyButton";
import { IconButton } from "./IconButton";
import { Notice } from "./Notice";
import { Textarea } from "./Textarea";

export type TransformPanelProps = {
  input: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean; rows?: number };
  output: { label: string; value: string; mono?: boolean; rows?: number };
  error?: string;
  options?: ReactNode;
  actions?: ReactNode;
  swap?: () => void;
  hint?: ReactNode;
  ref?: Ref<HTMLDivElement>;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

export function TransformPanel({ input, output, error, options, actions, swap, hint, className, ...rest }: TransformPanelProps) {
  return (
    <div {...rest} className={cx("ui-transform-panel", className)}>
      <Textarea
        label={input.label}
        value={input.value}
        onChange={(event) => input.onChange(event.target.value)}
        placeholder={input.placeholder}
        mono={input.mono}
        rows={input.rows ?? 6}
        spellCheck={false}
        aria-invalid={error ? true : undefined}
      />
      {options && <div className="ui-transform-panel__options">{options}</div>}
      {(swap || actions) && (
        <div className="ui-transform-panel__actions">
          {swap && <IconButton icon="arrows-left-right" label="Swap input and output" variant="secondary" onClick={swap} />}
          {actions}
        </div>
      )}
      {error && <Notice tone="danger" variant="inline">{error}</Notice>}
      <Textarea
        label={output.label}
        value={output.value}
        readOnly
        mono={output.mono}
        rows={output.rows ?? 6}
        spellCheck={false}
        trailing={<CopyButton value={output.value} appearance="icon" size="sm" disabled={!output.value} />}
      />
      {hint && <p className="ui-transform-panel__hint">{hint}</p>}
    </div>
  );
}

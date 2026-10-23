import { useCallback, useLayoutEffect, useRef, type ChangeEvent, type Ref, type TextareaHTMLAttributes } from "react";
import { cx } from "@/ui/lib/cx";
import { describedBy } from "@/ui/lib/field";
import { useStableId } from "@/ui/lib/ids";
import { withField, type FieldOwnProps } from "./Field";

export interface TextareaProps extends FieldOwnProps, TextareaHTMLAttributes<HTMLTextAreaElement> {
  mono?: boolean;
  resize?: "vertical" | "none";
  autoGrow?: boolean;
  minRows?: number;
  maxRows?: number;
  ref?: Ref<HTMLTextAreaElement>;
}

function assignRef<T>(ref: Ref<T> | undefined, node: T | null): void {
  if (typeof ref === "function") ref(node);
  else if (ref) (ref as { current: T | null }).current = node;
}

export function Textarea({
  label,
  hint,
  error,
  required,
  optional,
  labelHidden,
  layout,
  span,
  trailing,
  mono,
  resize = "vertical",
  autoGrow,
  minRows,
  maxRows,
  rows,
  id,
  className,
  ref,
  onChange,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...rest
}: TextareaProps) {
  const controlId = useStableId(id, "textarea");
  const inner = useRef<HTMLTextAreaElement | null>(null);

  const grow = useCallback(() => {
    const node = inner.current;
    if (!autoGrow || !node) return;
    const style = getComputedStyle(node);
    const line = parseFloat(style.lineHeight) || 20;
    const chrome =
      parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) +
      parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    node.style.height = "auto";
    const min = (minRows ?? rows ?? 2) * line + chrome;
    const max = maxRows ? maxRows * line + chrome : Infinity;
    const next = Math.min(max, Math.max(min, node.scrollHeight + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth)));
    node.style.height = `${next}px`;
    node.style.overflowY = node.scrollHeight + 2 > max ? "auto" : "hidden";
  }, [autoGrow, minRows, maxRows, rows]);

  useLayoutEffect(grow, [grow, rest.value]);

  const control = (
    <textarea
      {...rest}
      ref={(node) => {
        inner.current = node;
        assignRef(ref, node);
      }}
      id={controlId}
      rows={autoGrow ? (minRows ?? rows) : rows}
      required={required}
      className={cx("ui-textarea", className)}
      data-mono={mono ? "true" : undefined}
      data-resize={autoGrow ? "none" : resize}
      aria-invalid={error ? true : ariaInvalid}
      aria-describedby={describedBy(controlId, hint, error, ariaDescribedBy)}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
        onChange?.(event);
        grow();
      }}
    />
  );

  return withField(controlId, { label, hint, error, required, optional, labelHidden, layout, span, trailing }, control);
}

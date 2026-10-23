import { useEffect, useState, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { describedBy } from "@/ui/lib/field";
import { useStableId } from "@/ui/lib/ids";
import { Field } from "./Field";

export type ColorInputProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> & {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  hint?: ReactNode;
  error?: ReactNode;
  allowText?: boolean;
  disabled?: boolean;
  ref?: Ref<HTMLDivElement>;
};

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Normalises "#abc" / "abc" / "#aabbcc" to "#aabbcc"; null when invalid. */
function normalizeHex(input: string): string | null {
  const match = HEX.exec(input.trim());
  if (!match) return null;
  const raw = match[1].length === 3 ? [...match[1]].map((c) => c + c).join("") : match[1];
  return `#${raw.toLowerCase()}`;
}

export function ColorInput({
  label,
  value,
  onChange,
  hint,
  error,
  allowText = true,
  disabled,
  id,
  className,
  ...rest
}: ColorInputProps) {
  const baseId = useStableId(id, "color");
  const textId = `${baseId}-text`;
  const pickerId = allowText ? `${baseId}-picker` : baseId;
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const swatch = normalizeHex(value) ?? "#000000";
  const described = describedBy(allowText ? textId : pickerId, hint, error);

  return (
    <Field label={label} htmlFor={allowText ? textId : pickerId} hint={hint} error={error}>
      <div {...rest} className={cx("ui-color-input", className)} data-disabled={disabled ? "true" : undefined}>
        <span className="ui-color-input__swatch" style={{ backgroundColor: swatch }}>
          <input
            id={pickerId}
            type="color"
            className="ui-color-input__picker"
            value={swatch}
            disabled={disabled}
            aria-label={allowText ? `${label} picker` : undefined}
            aria-describedby={allowText ? undefined : described}
            aria-invalid={!allowText && error ? true : undefined}
            onChange={(event) => onChange(event.currentTarget.value)}
          />
        </span>
        {allowText && (
          <span className="ui-input ui-color-input__text" data-mono="true" data-size="md">
          <input
            id={textId}
            type="text"
            className="ui-input__control"
            value={draft}
            disabled={disabled}
            spellCheck={false}
            autoComplete="off"
            maxLength={7}
            aria-describedby={described}
            aria-invalid={error ? true : undefined}
            onChange={(event) => {
              const next = event.currentTarget.value;
              setDraft(next);
              const hex = normalizeHex(next);
              if (hex) onChange(hex);
            }}
            onBlur={() => setDraft(value)}
          />
          </span>
        )}
      </div>
    </Field>
  );
}

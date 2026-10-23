import { useState, type CSSProperties, type HTMLAttributes, type Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { rangePct } from "@/ui/lib/field";
import { useStableId } from "@/ui/lib/ids";

export type SliderValue = number | [number, number];

export interface SliderProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  label: string;
  min: number;
  max: number;
  step?: number;
  value?: SliderValue;
  defaultValue?: SliderValue;
  onChange?: (value: SliderValue) => void;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  marks?: number[];
  disabled?: boolean;
  name?: string;
  ref?: Ref<HTMLDivElement>;
}

export function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  defaultValue,
  onChange,
  showValue,
  formatValue = String,
  marks,
  disabled,
  name,
  id,
  className,
  style,
  ...rest
}: SliderProps) {
  const baseId = useStableId(id, "slider");
  const [inner, setInner] = useState<SliderValue>(defaultValue ?? value ?? min);
  const current = value !== undefined ? value : inner;
  const range = Array.isArray(current);
  const [low, high] = range ? current : [min, current];

  const commit = (next: SliderValue) => {
    setInner(next);
    onChange?.(next);
  };

  const vars = {
    ...style,
    "--ui-slider-start": `${range ? rangePct(low, min, max) : 0}%`,
    "--ui-slider-pct": `${rangePct(high, min, max)}%`,
  } as CSSProperties;

  const text = range ? `${formatValue(low)} – ${formatValue(high)}` : formatValue(high);
  const labelId = `${baseId}-label`;
  const inputId = range ? `${baseId}-input` : (id ?? `${baseId}-input`);
  const common = { type: "range", min, max, step, disabled, className: "ui-slider__input" } as const;

  return (
    <div
      {...rest}
      id={range ? id : undefined}
      className={cx("ui-slider", className)}
      data-range={range ? "true" : undefined}
      role={range ? "group" : undefined}
      aria-labelledby={range ? labelId : undefined}
      style={vars}
    >
      <div className="ui-slider__head">
        {range ? (
          <span className="ui-slider__label" id={labelId}>
            {label}
          </span>
        ) : (
          <label className="ui-slider__label" id={labelId} htmlFor={inputId}>
            {label}
          </label>
        )}
        {showValue && (
          <output className="ui-slider__value" htmlFor={range ? `${inputId}-min ${inputId}-max` : inputId}>
            {text}
          </output>
        )}
      </div>
      <div className="ui-slider__track">
        {range ? (
          <>
            <input
              {...common}
              id={`${inputId}-min`}
              name={name ? `${name}-min` : undefined}
              aria-label={`Minimum ${label}`}
              value={low}
              onChange={(event) => commit([Math.min(Number(event.target.value), high), high])}
            />
            <input
              {...common}
              id={`${inputId}-max`}
              name={name ? `${name}-max` : undefined}
              aria-label={`Maximum ${label}`}
              value={high}
              onChange={(event) => commit([low, Math.max(Number(event.target.value), low)])}
            />
          </>
        ) : (
          <input
            {...common}
            id={inputId}
            name={name}
            value={high}
            onChange={(event) => commit(Number(event.target.value))}
          />
        )}
      </div>
      {marks && marks.length > 0 && (
        <div className="ui-slider__marks" aria-hidden="true">
          {marks.map((mark) => (
            <span key={mark} className="ui-slider__mark" style={{ "--ui-slider-mark": `${rangePct(mark, min, max)}%` } as CSSProperties}>
              {formatValue(mark)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

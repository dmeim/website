import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FieldsetHTMLAttributes,
  type Ref,
} from "react";
import { Icon, type IconName } from "@/ui/icons";
import { cx } from "@/ui/lib/cx";
import type { ControlSize } from "@/ui/lib/field";
import { useStableId } from "@/ui/lib/ids";

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: IconName;
  iconOnly?: boolean;
  disabled?: boolean;
  swatch?: string;
}

export interface SegmentedControlProps
  extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "onChange" | "defaultValue"> {
  name: string;
  label: string;
  labelHidden?: boolean;
  options: SegmentedOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  size?: ControlSize;
  equal?: boolean;
  indicator?: "slide" | "fill";
  ref?: Ref<HTMLFieldSetElement>;
}

export function SegmentedControl({
  name,
  label,
  labelHidden,
  options,
  value,
  defaultValue,
  onChange,
  size = "md",
  equal = true,
  indicator = "slide",
  id,
  className,
  style,
  ...rest
}: SegmentedControlProps) {
  const baseId = useStableId(id, "seg");
  const [inner, setInner] = useState(defaultValue);
  const current = value !== undefined ? value : inner;
  const index = options.findIndex((option) => option.value === current);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [measured, setMeasured] = useState<{ x: number; w: number } | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (equal || !track) return;
    const measure = () => {
      const checked = track.querySelectorAll<HTMLElement>(".ui-segmented-control__option")[index];
      setMeasured(checked ? { x: checked.offsetLeft, w: checked.offsetWidth } : null);
    };
    measure();
    const frame = requestAnimationFrame(() => setReady(true));
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [equal, index, options]);

  const vars = {
    ...style,
    "--ui-seg-count": options.length,
    "--ui-seg-index": Math.max(index, 0),
    ...(!equal && measured ? { "--ui-seg-x": `${measured.x}px`, "--ui-seg-w": `${measured.w}px` } : {}),
  } as CSSProperties;

  return (
    <fieldset
      {...rest}
      id={id}
      className={cx("ui-segmented-control", className)}
      data-size={size}
      data-equal={equal ? "true" : "false"}
      data-indicator={indicator}
      data-selected={index >= 0 ? "true" : "false"}
      data-measured={!equal && measured && ready ? "" : undefined}
      style={vars}
    >
      <legend className={cx("ui-segmented-control__legend", labelHidden && "ui-visually-hidden")}>{label}</legend>
      <div className="ui-segmented-control__track" ref={trackRef}>
        <span className="ui-segmented-control__thumb" aria-hidden="true" />
        {options.map((option, optionIndex) => {
          const optionId = `${baseId}-${optionIndex}`;
          return (
            <label key={option.value} className="ui-segmented-control__option" htmlFor={optionId}>
              <input
                id={optionId}
                type="radio"
                className="ui-segmented-control__input"
                name={name}
                value={option.value}
                disabled={option.disabled}
                checked={current === option.value}
                onChange={(event) => {
                  if (!event.target.checked) return;
                  setInner(option.value);
                  onChange?.(option.value);
                }}
              />
              {option.swatch && (
                <span className="ui-segmented-control__swatch" style={{ background: option.swatch }} aria-hidden="true" />
              )}
              {option.icon && <Icon name={option.icon} className="ui-segmented-control__icon" />}
              <span className={cx("ui-segmented-control__label", option.iconOnly && "ui-visually-hidden")}>
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

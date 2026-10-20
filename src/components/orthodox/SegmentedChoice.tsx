type Option<T extends string> = { value: T; label: string };

type SegmentedChoiceProps<T extends string> = {
  legend: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Adds a colour chip keyed by `data-swatch` (styled in CSS). */
  swatches?: boolean;
};

export function SegmentedChoice<T extends string>({
  legend,
  options,
  value,
  onChange,
  swatches = false,
}: SegmentedChoiceProps<T>) {
  return (
    <fieldset className="ow-field">
      <legend className="ow-field__label">{legend}</legend>
      <div className="ow-segments">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="ow-segment"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {swatches ? (
              <span
                className="ow-segment__chip"
                data-swatch={option.value}
                aria-hidden="true"
              />
            ) : null}
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

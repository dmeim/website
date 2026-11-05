import { useCallback, useState } from "react";

import { FormGrid, Input, Notice, Panel, ToolFrame } from "@/ui/react";
import {
  TEMPERATURE_SCALES,
  convertFromScale,
  initialTemperatures,
  isBelowAbsoluteZero,
  parseTemperatureInput,
  type TemperatureScale,
} from "@/lib/tools/temperature-converter";

function formatScaleValue(value: number): string {
  return Number.isFinite(value) ? String(value) : "";
}

function blankValues(): Record<TemperatureScale, string> {
  const next = {} as Record<TemperatureScale, string>;
  for (const { id } of TEMPERATURE_SCALES) {
    next[id] = "";
  }
  return next;
}

function valuesToStrings(
  values: Record<TemperatureScale, number>,
): Record<TemperatureScale, string> {
  const next = {} as Record<TemperatureScale, string>;
  for (const { id } of TEMPERATURE_SCALES) {
    next[id] = formatScaleValue(values[id]);
  }
  return next;
}

export default function TemperatureConverter() {
  const [values, setValues] = useState<Record<TemperatureScale, string>>(() =>
    valuesToStrings(initialTemperatures()),
  );

  const [belowAbsoluteZero, setBelowAbsoluteZero] = useState(false);

  const onScaleChange = useCallback((scale: TemperatureScale, raw: string) => {
    const parsed = parseTemperatureInput(raw);
    setBelowAbsoluteZero(parsed !== undefined && isBelowAbsoluteZero(scale, parsed));
    // Keep the typed source string; only the other scales are rounded, and they clear with an empty source.
    setValues({
      ...(parsed === undefined ? blankValues() : valuesToStrings(convertFromScale(scale, parsed))),
      [scale]: raw,
    });
  }, []);

  return (
    <ToolFrame>
      <Panel
        title="Temperature converter"
        titleId="temp-heading"
        description="Convert between Kelvin, Celsius, Fahrenheit, Rankine, Delisle, Newton, Réaumur, and Rømer. Edit any scale to update the rest."
      >
        <FormGrid columns={2} role="group" aria-label="Temperature scales">
          {TEMPERATURE_SCALES.map((scale, index) => (
            <Input
              key={scale.id}
              id={`temp-${scale.id}`}
              label={scale.title}
              type="number"
              inputMode="decimal"
              step="any"
              mono
              suffix={scale.unit}
              value={values[scale.id]}
              autoFocus={index === 0}
              onChange={(event) => onScaleChange(scale.id, event.target.value)}
              data-testid={`temp-${scale.id}`}
            />
          ))}
        </FormGrid>

        {belowAbsoluteZero ? (
          <Notice tone="warning" live="polite">
            This is below absolute zero (0 K), so it is not a physically possible temperature.
          </Notice>
        ) : null}
      </Panel>
    </ToolFrame>
  );
}

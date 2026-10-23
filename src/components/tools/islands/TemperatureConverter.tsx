import { useCallback, useState } from "react";

import { FormGrid, Input, Panel, ToolFrame } from "@/ui/react";
import {
  TEMPERATURE_SCALES,
  convertFromScale,
  initialTemperatures,
  parseTemperatureInput,
  type TemperatureScale,
} from "@/lib/tools/temperature-converter";

function formatScaleValue(value: number): string {
  return String(value);
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

  const onScaleChange = useCallback((scale: TemperatureScale, raw: string) => {
    setValues((prev) => {
      const parsed = parseTemperatureInput(raw);
      if (parsed === undefined) {
        return { ...prev, [scale]: raw };
      }

      // Keep the typed source string; floor only the other scales (it-tools omit).
      return { ...valuesToStrings(convertFromScale(scale, parsed)), [scale]: raw };
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
      </Panel>
    </ToolFrame>
  );
}

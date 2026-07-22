import { useCallback, useState } from "react";

import {
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
} from "@/components/tools/ui";
import {
  TEMPERATURE_SCALES,
  convertFromScale,
  initialTemperatures,
  parseTemperatureInput,
  type TemperatureScale,
} from "@/lib/tools/temperature-converter";

import "./TemperatureConverter.css";

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
    <ToolIsland className="temp-tool">
      <ToolPanel labelledBy="temp-heading" className="temp-tool__panel">
        <ToolSectionHeading
          title="Temperature converter"
          titleId="temp-heading"
          description={
            <ToolHint>
              Convert between Kelvin, Celsius, Fahrenheit, Rankine, Delisle,
              Newton, Réaumur, and Rømer. Edit any scale to update the rest.
            </ToolHint>
          }
        />

        <div className="temp-list" role="group" aria-label="Temperature scales">
          {TEMPERATURE_SCALES.map((scale, index) => (
            <div key={scale.id} className="temp-row">
              <ToolInput
                id={`temp-${scale.id}`}
                label={scale.title}
                type="number"
                inputMode="decimal"
                step="any"
                value={values[scale.id]}
                autoFocus={index === 0}
                onChange={(event) => onScaleChange(scale.id, event.target.value)}
                data-testid={`temp-${scale.id}`}
                fieldClassName="temp-row__field"
                className="temp-row__input"
              />
              <span className="temp-row__unit" aria-hidden="true">
                {scale.unit}
              </span>
            </div>
          ))}
        </div>
      </ToolPanel>
    </ToolIsland>
  );
}

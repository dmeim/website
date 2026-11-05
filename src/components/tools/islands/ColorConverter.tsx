import { useCallback, useState } from "react";

import {
  ColorInput,
  CopyButton,
  FormGrid,
  Input,
  Panel,
  Slider,
  Stack,
  Swatch,
  ToolFrame,
} from "@/ui/react";
import {
  COLOR_FORMATS,
  alphaOf,
  applyColorInput,
  initialColorValues,
  invalidMessageFor,
  isColorInputValid,
  previewColor,
  withAlpha,
  type ColorFormatId,
  type ColorValues,
} from "@/lib/tools/color-converter";

export default function ColorConverter() {
  const [values, setValues] = useState<ColorValues>(() => initialColorValues());

  const onFormatChange = useCallback((id: ColorFormatId, raw: string) => {
    setValues((current) => applyColorInput(current, id, raw).values);
  }, []);

  const alpha = alphaOf(values);
  const preview = previewColor(values);

  return (
    <ToolFrame>
      <Panel
        title="Color converter"
        titleId="clc-heading"
        description="Convert between hex, rgb, hsl, hwb, lch, cmyk, and CSS name. Edit any field to update the rest live."
        actions={<Swatch color={preview} size="sm" aria-hidden="true" />}
      >
        <FormGrid columns={2} role="group" aria-label="Color formats">
          {COLOR_FORMATS.map((format) => {
            const value = values[format.id];

            if (format.type === "color-picker") {
              return (
                <Stack key={format.id} gap="xs">
                  <ColorInput
                    id={`clc-${format.id}`}
                    label={format.label}
                    allowText={false}
                    value={value || "#000000"}
                    onChange={(hex) => onFormatChange(format.id, withAlpha(hex, alpha))}
                  />
                  <Slider
                    label="alpha"
                    min={0}
                    max={100}
                    value={Math.round(alpha * 100)}
                    formatValue={(percent) => `${percent}%`}
                    showValue
                    onChange={(percent) =>
                      onFormatChange(format.id, withAlpha(values.picker, Number(percent) / 100))
                    }
                  />
                </Stack>
              );
            }

            const showError = !isColorInputValid(value, format.id);

            return (
              <Input
                key={format.id}
                id={`clc-${format.id}`}
                label={format.label}
                mono
                value={value}
                placeholder={format.placeholder}
                spellCheck={false}
                clearable
                error={showError ? invalidMessageFor(format.id) : undefined}
                onChange={(event) =>
                  onFormatChange(format.id, event.target.value)
                }
                autoFocus={format.id === "hex"}
                trailing={
                  <CopyButton
                    appearance="icon"
                    size="sm"
                    value={value}
                    label={`Copy ${format.label}`}
                    disabled={!value}
                  />
                }
              />
            );
          })}
        </FormGrid>
      </Panel>
    </ToolFrame>
  );
}

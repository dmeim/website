import { useCallback, useState } from "react";

import {
  ColorInput,
  CopyButton,
  FormGrid,
  Input,
  Panel,
  Swatch,
  ToolFrame,
} from "@/ui/react";
import {
  COLOR_FORMATS,
  applyColorInput,
  initialColorValues,
  invalidMessageFor,
  isColorInputValid,
  type ColorFormatId,
  type ColorValues,
} from "@/lib/tools/color-converter";

export default function ColorConverter() {
  const [values, setValues] = useState<ColorValues>(() => initialColorValues());
  const [invalidId, setInvalidId] = useState<ColorFormatId | null>(null);

  const onFormatChange = useCallback((id: ColorFormatId, raw: string) => {
    setValues((current) => {
      const { values: next, valid } = applyColorInput(current, id, raw);
      setInvalidId(valid || raw === "" ? null : id);
      return next;
    });
  }, []);

  const preview = values.hex || values.picker || "#000000";

  return (
    <ToolFrame>
      <Panel
        title="Color converter"
        titleId="clc-heading"
        description="Convert between hex, rgb, hsl, hwb, lch, cmyk, and CSS name — edit any field to update the rest live."
        actions={<Swatch color={preview} size="sm" aria-hidden="true" />}
      >
        <FormGrid columns={2} role="group" aria-label="Color formats">
          {COLOR_FORMATS.map((format) => {
            const value = values[format.id];

            if (format.type === "color-picker") {
              return (
                <ColorInput
                  key={format.id}
                  id={`clc-${format.id}`}
                  label={format.label}
                  allowText={false}
                  value={value || "#000000"}
                  onChange={(hex) => onFormatChange(format.id, hex)}
                />
              );
            }

            const showError =
              invalidId === format.id && !isColorInputValid(value);

            return (
              <Input
                key={format.id}
                id={`clc-${format.id}`}
                label={format.label}
                mono
                value={value}
                placeholder={format.placeholder}
                spellCheck={false}
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

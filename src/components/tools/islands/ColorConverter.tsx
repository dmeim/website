import { useCallback, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolField,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  COLOR_FORMATS,
  applyColorInput,
  initialColorValues,
  invalidMessageFor,
  isColorInputValid,
  type ColorFormatId,
  type ColorValues,
} from "@/lib/tools/color-converter";

import "./ColorConverter.css";

export default function ColorConverter() {
  const [values, setValues] = useState<ColorValues>(() => initialColorValues());
  const [invalidId, setInvalidId] = useState<ColorFormatId | null>(null);
  const [actionStatus, setActionStatus] = useState("");

  const onFormatChange = useCallback((id: ColorFormatId, raw: string) => {
    setValues((current) => {
      const { values: next, valid } = applyColorInput(current, id, raw);
      setInvalidId(valid || raw === "" ? null : id);
      return next;
    });
  }, []);

  const copyValue = useCallback(async (label: string, value: string) => {
    if (!value) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(value);
      setActionStatus(`${label} copied.`);
    } catch {
      setActionStatus("Copy failed. Select the value and copy it manually.");
    }
  }, []);

  return (
    <ToolIsland className="clc-tool">
      <ToolPanel labelledBy="clc-heading" className="clc-tool__panel">
        <ToolSectionHeading
          title="Color converter"
          titleId="clc-heading"
          description={
            <ToolHint>
              Convert between hex, rgb, hsl, hwb, lch, cmyk, and CSS name —
              edit any field to update the rest live.
            </ToolHint>
          }
        />

        <div className="clc-formats" role="list" aria-label="Color formats">
          {COLOR_FORMATS.map((format) => {
            const value = values[format.id];
            const showError =
              invalidId === format.id && !isColorInputValid(value);

            if (format.type === "color-picker") {
              return (
                <div key={format.id} className="clc-format" role="listitem">
                  <span className="clc-format__label">{format.label}</span>
                  <ToolField
                    label={format.label}
                    htmlFor={`clc-${format.id}`}
                    full
                    className="clc-format__field"
                  >
                    <input
                      id={`clc-${format.id}`}
                      type="color"
                      value={value || "#000000"}
                      onChange={(event) =>
                        onFormatChange(format.id, event.target.value)
                      }
                      aria-label={format.label}
                    />
                  </ToolField>
                  <ToolActionRow className="clc-format__actions">
                    <ToolButton
                      type="button"
                      onClick={() => void copyValue(format.label, value)}
                      disabled={!value}
                    >
                      Copy
                    </ToolButton>
                  </ToolActionRow>
                </div>
              );
            }

            return (
              <div key={format.id} className="clc-format" role="listitem">
                <span className="clc-format__label">{format.label}</span>
                <div className="clc-format__body">
                  <ToolInput
                    id={`clc-${format.id}`}
                    label={format.label}
                    full
                    value={value}
                    placeholder={format.placeholder}
                    spellCheck={false}
                    className="clc-format__value tool-code"
                    fieldClassName="clc-format__field"
                    aria-invalid={showError ? true : undefined}
                    onChange={(event) =>
                      onFormatChange(format.id, event.target.value)
                    }
                    autoFocus={format.id === "hex"}
                  />
                  {showError ? (
                    <ToolStatus tone="error" live="polite">
                      {invalidMessageFor(format.id)}
                    </ToolStatus>
                  ) : null}
                </div>
                <ToolActionRow className="clc-format__actions">
                  <ToolButton
                    type="button"
                    onClick={() => void copyValue(format.label, value)}
                    disabled={!value}
                  >
                    Copy
                  </ToolButton>
                </ToolActionRow>
              </div>
            );
          })}
        </div>

        {actionStatus ? (
          <ToolStatus tone="success">{actionStatus}</ToolStatus>
        ) : null}
      </ToolPanel>
    </ToolIsland>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolFormGrid,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolSelect,
  ToolStatus,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  DATE_FORMATS,
  DEFAULT_FORMAT_INDEX,
  detectFormatIndex,
  formatAll,
  isInputValid,
  resolveDate,
} from "@/lib/tools/date-converter";

import "./DateConverter.css";

export default function DateConverter() {
  const [input, setInput] = useState("");
  const [formatIndex, setFormatIndex] = useState(DEFAULT_FORMAT_INDEX);
  const [now, setNow] = useState(() => new Date());
  const [actionStatus, setActionStatus] = useState("");

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const valid = useMemo(
    () => isInputValid(input, formatIndex),
    [input, formatIndex],
  );

  const normalizedDate = useMemo(
    () => resolveDate(input, formatIndex, now),
    [input, formatIndex, now],
  );

  const formats = useMemo(
    () => formatAll(normalizedDate, valid),
    [normalizedDate, valid],
  );

  const onInputChange = useCallback((value: string) => {
    setInput(value);
    const matchingIndex = detectFormatIndex(value);
    if (matchingIndex !== -1) {
      setFormatIndex(matchingIndex);
    }
  }, []);

  const copyFormat = useCallback(async (label: string, value: string) => {
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
    <ToolIsland className="dc-tool">
      <ToolPanel labelledBy="dc-heading" className="dc-tool__panel">
        <ToolSectionHeading
          title="Date-time converter"
          titleId="dc-heading"
          description={
            <ToolHint>
              Paste a date string (or leave blank for now) to see ISO, RFC,
              Unix, Mongo, Excel, and other formats update live — then copy any
              result.
            </ToolHint>
          }
        />

        <ToolFormGrid className="dc-controls">
          <ToolInput
            id="dc-input"
            label="Date string"
            full
            value={input}
            placeholder="Put your date string here..."
            spellCheck={false}
            autoFocus
            onChange={(event) => onInputChange(event.target.value)}
            aria-invalid={valid ? undefined : true}
          />

          <ToolSelect
            id="dc-format"
            label="Input format"
            full
            value={formatIndex}
            onChange={(event) => setFormatIndex(Number(event.target.value))}
            fieldClassName="dc-format-select"
          >
            {DATE_FORMATS.map((format, index) => (
              <option key={format.id} value={index}>
                {format.name}
              </option>
            ))}
          </ToolSelect>
        </ToolFormGrid>

        {!valid ? (
          <ToolStatus tone="error" live="polite">
            This date is invalid for this format
          </ToolStatus>
        ) : null}

        <div className="dc-formats" role="list" aria-label="Date formats">
          {formats.map((format) => (
            <div key={format.id} className="dc-format" role="listitem">
              <span className="dc-format__label">{format.name}</span>
              <ToolInput
                id={`dc-format-${format.id}`}
                label={format.name}
                full
                readOnly
                value={format.value}
                placeholder="Invalid date..."
                className="dc-format__value tool-code"
                aria-live="polite"
              />
              <ToolActionRow className="dc-format__actions">
                <ToolButton
                  type="button"
                  onClick={() => void copyFormat(format.name, format.value)}
                  disabled={!format.value}
                >
                  Copy
                </ToolButton>
              </ToolActionRow>
            </div>
          ))}
        </div>

        {actionStatus ? (
          <ToolStatus tone="success">{actionStatus}</ToolStatus>
        ) : null}
      </ToolPanel>
    </ToolIsland>
  );
}

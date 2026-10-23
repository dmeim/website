import { useCallback, useEffect, useMemo, useState } from "react";

import {
  FormGrid,
  Input,
  KeyValue,
  Notice,
  Panel,
  Select,
  ToolFrame,
} from "@/ui/react";
import {
  DATE_FORMATS,
  DEFAULT_FORMAT_INDEX,
  detectFormatIndex,
  formatAll,
  isInputValid,
  resolveDate,
} from "@/lib/tools/date-converter";

export default function DateConverter() {
  const [input, setInput] = useState("");
  const [formatIndex, setFormatIndex] = useState(DEFAULT_FORMAT_INDEX);
  const [now, setNow] = useState(() => new Date());

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

  return (
    <ToolFrame>
      <Panel
        title="Date-time converter"
        titleId="dc-heading"
        description="Paste a date string (or leave blank for now) to see ISO, RFC, Unix, Mongo, Excel, and other formats update live — then copy any result."
      >
        <FormGrid columns={2}>
          <Input
            id="dc-input"
            label="Date string"
            value={input}
            placeholder="Put your date string here..."
            spellCheck={false}
            autoFocus
            onChange={(event) => onInputChange(event.target.value)}
            aria-invalid={valid ? undefined : true}
          />
          <Select
            id="dc-format"
            label="Input format"
            value={String(formatIndex)}
            onChange={(event) => setFormatIndex(Number(event.target.value))}
            options={DATE_FORMATS.map((format, index) => ({
              value: String(index),
              label: format.name,
            }))}
          />
        </FormGrid>

        {!valid ? (
          <Notice tone="danger" live="polite">
            This date is invalid for this format
          </Notice>
        ) : null}

        <KeyValue
          aria-label="Date formats"
          aria-live="polite"
          items={formats.map((format) => ({
            label: format.name,
            value: format.value || "Invalid date...",
            mono: true,
            copy: format.value ? format.value : false,
            tone: format.value ? "default" : "muted",
          }))}
        />
      </Panel>
    </ToolFrame>
  );
}

import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  DEFAULT_CASE_INPUT,
  convertAllCases,
} from "@/lib/tools/case-converter";

import "./CaseConverter.css";

export default function CaseConverter() {
  const [input, setInput] = useState(DEFAULT_CASE_INPUT);
  const [actionStatus, setActionStatus] = useState("");

  const formats = useMemo(() => convertAllCases(input), [input]);

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
    <ToolIsland className="cc-tool">
      <ToolPanel labelledBy="cc-heading" className="cc-tool__panel">
        <ToolSectionHeading
          title="Case converter"
          titleId="cc-heading"
          description={
            <ToolHint>
              Type a string to see camel, snake, kebab, Pascal, constant, and
              other formats update live — then copy any result.
            </ToolHint>
          }
        />

        <ToolInput
          id="cc-input"
          label="Your string"
          full
          value={input}
          placeholder="Your string…"
          onChange={(event) => setInput(event.target.value)}
          autoFocus
        />

        <div className="cc-formats" role="list" aria-label="Case formats">
          {formats.map((format) => (
            <div key={format.id} className="cc-format" role="listitem">
              <span className="cc-format__label">{format.label}</span>
              <ToolInput
                id={`cc-format-${format.id}`}
                label={format.label}
                full
                readOnly
                value={format.value}
                className="cc-format__value tool-code"
                aria-live="polite"
              />
              <ToolActionRow className="cc-format__actions">
                <ToolButton
                  type="button"
                  onClick={() => void copyFormat(format.label, format.value)}
                  disabled={!format.value}
                >
                  Copy
                </ToolButton>
              </ToolActionRow>
            </div>
          ))}
        </div>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}

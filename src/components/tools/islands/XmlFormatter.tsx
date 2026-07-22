import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolCheck,
  ToolFormGrid,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolTextarea,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  DEFAULT_COLLAPSE_CONTENT,
  DEFAULT_INDENT_SIZE,
  DEFAULT_RAW_XML,
  MAX_INDENT_SIZE,
  MIN_INDENT_SIZE,
  clampIndentSize,
  formatXml,
  isValidXml,
} from "@/lib/tools/xml-formatter";

import "./XmlFormatter.css";

export default function XmlFormatter() {
  const [rawXml, setRawXml] = useState(DEFAULT_RAW_XML);
  const [collapseContent, setCollapseContent] = useState(DEFAULT_COLLAPSE_CONTENT);
  const [indentSize, setIndentSize] = useState(DEFAULT_INDENT_SIZE);
  const [actionStatus, setActionStatus] = useState("");

  const inputInvalid = rawXml.trim() !== "" && !isValidXml(rawXml);

  const formatted = useMemo(
    () =>
      inputInvalid
        ? ""
        : formatXml({ rawXml, indentSize, collapseContent }),
    [rawXml, indentSize, collapseContent, inputInvalid],
  );

  const copyFormatted = useCallback(async () => {
    if (!formatted) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(formatted);
      setActionStatus("Formatted XML copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [formatted]);

  return (
    <ToolIsland className="xf-tool">
      <ToolPanel labelledBy="xf-heading" className="xf-tool__panel">
        <ToolSectionHeading
          title="XML formatter"
          titleId="xf-heading"
          description={
            <ToolHint>
              Paste XML to format it. Optionally collapse simple text content
              onto one line and set the indent size.
            </ToolHint>
          }
        />

        <ToolFormGrid className="xf-settings">
          <ToolCheck
            id="xf-collapse"
            label="Collapse content"
            toggle
            checked={collapseContent}
            onChange={(event) => setCollapseContent(event.target.checked)}
          />
          <ToolInput
            id="xf-indent"
            label="Indent size"
            type="number"
            min={MIN_INDENT_SIZE}
            max={MAX_INDENT_SIZE}
            step={1}
            value={indentSize}
            onChange={(event) => {
              const next = event.target.valueAsNumber;
              setIndentSize(
                Number.isNaN(next) ? DEFAULT_INDENT_SIZE : clampIndentSize(next),
              );
            }}
          />
        </ToolFormGrid>

        <ToolTextarea
          id="xf-input"
          label="Your XML"
          full
          code
          rows={12}
          value={rawXml}
          placeholder="Paste your XML here..."
          onChange={(event) => setRawXml(event.target.value)}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          aria-invalid={inputInvalid || undefined}
        />

        {inputInvalid ? (
          <ToolStatus tone="error" live="polite">
            Provided XML is not valid.
          </ToolStatus>
        ) : null}

        <ToolTextarea
          id="xf-output"
          label="Formatted XML from your XML"
          full
          code
          readOnly
          rows={12}
          value={formatted}
          placeholder="Formatted XML appears here"
          className="xf-output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyFormatted()}
            disabled={!formatted}
          >
            Copy XML
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}

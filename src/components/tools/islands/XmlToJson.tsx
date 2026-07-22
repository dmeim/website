import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolHint,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolTextarea,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import { isValidXml, xmlToJson } from "@/lib/tools/xml-to-json";

import "./XmlToJson.css";

export default function XmlToJson() {
  const [input, setInput] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const inputInvalid = input !== "" && !isValidXml(input);

  const jsonOutput = useMemo(
    () => (inputInvalid ? "" : xmlToJson(input)),
    [input, inputInvalid],
  );

  const copyJson = useCallback(async () => {
    if (!jsonOutput) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(jsonOutput);
      setActionStatus("JSON copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [jsonOutput]);

  return (
    <ToolIsland className="x2j-tool">
      <ToolPanel labelledBy="x2j-heading" className="x2j-tool__panel">
        <ToolSectionHeading
          title="XML to JSON"
          titleId="x2j-heading"
          description={
            <ToolHint>
              Paste XML to convert it into pretty-printed JSON.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="x2j-input"
          label="Your XML content"
          full
          code
          rows={10}
          value={input}
          placeholder="Paste your XML content here..."
          onChange={(event) => setInput(event.target.value)}
          autoFocus
          aria-invalid={inputInvalid || undefined}
        />

        {inputInvalid ? (
          <ToolStatus tone="error" live="polite">
            Provided XML is not valid.
          </ToolStatus>
        ) : null}

        <ToolTextarea
          id="x2j-output"
          label="Converted JSON"
          full
          code
          readOnly
          rows={12}
          value={jsonOutput}
          placeholder="JSON output appears here"
          className="x2j-output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyJson()}
            disabled={!jsonOutput}
          >
            Copy JSON
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}

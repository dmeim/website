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
import { isValidJson, jsonToXml } from "@/lib/tools/json-to-xml";

import "./JsonToXml.css";

export default function JsonToXml() {
  const [input, setInput] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const inputInvalid = input !== "" && !isValidJson(input);

  const xmlOutput = useMemo(
    () => (inputInvalid ? "" : jsonToXml(input)),
    [input, inputInvalid],
  );

  const copyXml = useCallback(async () => {
    if (!xmlOutput) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(xmlOutput);
      setActionStatus("XML copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [xmlOutput]);

  return (
    <ToolIsland className="j2x-tool">
      <ToolPanel labelledBy="j2x-heading" className="j2x-tool__panel">
        <ToolSectionHeading
          title="JSON to XML"
          titleId="j2x-heading"
          description={
            <ToolHint>
              Paste JSON to convert it into compact XML. JSON5 syntax (unquoted
              keys, trailing commas) is accepted.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="j2x-input"
          label="Your JSON content"
          full
          code
          rows={10}
          value={input}
          placeholder="Paste your JSON content here..."
          onChange={(event) => setInput(event.target.value)}
          autoFocus
          aria-invalid={inputInvalid || undefined}
        />

        {inputInvalid ? (
          <ToolStatus tone="error" live="polite">
            Provided JSON is not valid.
          </ToolStatus>
        ) : null}

        <ToolTextarea
          id="j2x-output"
          label="Converted XML"
          full
          code
          readOnly
          rows={12}
          value={xmlOutput}
          placeholder="XML output appears here"
          className="j2x-output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyXml()}
            disabled={!xmlOutput}
          >
            Copy XML
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}

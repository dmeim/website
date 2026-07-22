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
import { isValidYaml, yamlToJson } from "@/lib/tools/yaml-to-json-converter";

import "./YamlToJsonConverter.css";

export default function YamlToJsonConverter() {
  const [input, setInput] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const inputInvalid = input !== "" && !isValidYaml(input);

  const jsonOutput = useMemo(
    () => (inputInvalid ? "" : yamlToJson(input)),
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
    <ToolIsland className="y2j-tool">
      <ToolPanel labelledBy="y2j-heading" className="y2j-tool__panel">
        <ToolSectionHeading
          title="YAML to JSON"
          titleId="y2j-heading"
          description={
            <ToolHint>
              Paste YAML to convert it into pretty-printed JSON. Merge keys and
              anchors are supported.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="y2j-input"
          label="Your YAML"
          full
          code
          rows={10}
          value={input}
          placeholder="Paste your yaml here..."
          onChange={(event) => setInput(event.target.value)}
          autoFocus
          aria-invalid={inputInvalid || undefined}
        />

        {inputInvalid ? (
          <ToolStatus tone="error" live="polite">
            Provided YAML is not valid.
          </ToolStatus>
        ) : null}

        <ToolTextarea
          id="y2j-output"
          label="JSON from your YAML"
          full
          code
          readOnly
          rows={12}
          value={jsonOutput}
          placeholder="JSON output appears here"
          className="y2j-output"
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

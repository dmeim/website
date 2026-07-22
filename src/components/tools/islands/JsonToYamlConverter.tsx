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
import { isValidJson, jsonToYaml } from "@/lib/tools/json-to-yaml-converter";

import "./JsonToYamlConverter.css";

export default function JsonToYamlConverter() {
  const [input, setInput] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const inputInvalid = input !== "" && !isValidJson(input);

  const yamlOutput = useMemo(
    () => (inputInvalid ? "" : jsonToYaml(input)),
    [input, inputInvalid],
  );

  const copyYaml = useCallback(async () => {
    if (!yamlOutput) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(yamlOutput);
      setActionStatus("YAML copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [yamlOutput]);

  return (
    <ToolIsland className="j2y-tool">
      <ToolPanel labelledBy="j2y-heading" className="j2y-tool__panel">
        <ToolSectionHeading
          title="JSON to YAML"
          titleId="j2y-heading"
          description={
            <ToolHint>
              Paste JSON to convert it into YAML. JSON5 syntax (unquoted keys,
              trailing commas) is accepted.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="j2y-input"
          label="Your JSON"
          full
          code
          rows={10}
          value={input}
          placeholder="Paste your JSON here..."
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
          id="j2y-output"
          label="YAML from your JSON"
          full
          code
          readOnly
          rows={12}
          value={yamlOutput}
          placeholder="YAML output appears here"
          className="j2y-output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyYaml()}
            disabled={!yamlOutput}
          >
            Copy YAML
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}

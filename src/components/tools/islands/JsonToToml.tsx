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
import { isValidJson, jsonToToml } from "@/lib/tools/json-to-toml";

import "./JsonToToml.css";

export default function JsonToToml() {
  const [input, setInput] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const inputInvalid = input !== "" && !isValidJson(input);

  const tomlOutput = useMemo(
    () => (inputInvalid ? "" : jsonToToml(input)),
    [input, inputInvalid],
  );

  const copyToml = useCallback(async () => {
    if (!tomlOutput) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(tomlOutput);
      setActionStatus("TOML copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [tomlOutput]);

  return (
    <ToolIsland className="j2t-tool">
      <ToolPanel labelledBy="j2t-heading" className="j2t-tool__panel">
        <ToolSectionHeading
          title="JSON to TOML"
          titleId="j2t-heading"
          description={
            <ToolHint>
              Paste JSON to convert it into TOML. JSON5 syntax (unquoted keys,
              trailing commas) is accepted.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="j2t-input"
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
          id="j2t-output"
          label="TOML from your JSON"
          full
          code
          readOnly
          rows={12}
          value={tomlOutput}
          placeholder="TOML output appears here"
          className="j2t-output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyToml()}
            disabled={!tomlOutput}
          >
            Copy TOML
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}

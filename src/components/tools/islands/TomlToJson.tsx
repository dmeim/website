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
import { isValidToml, tomlToJson } from "@/lib/tools/toml-to-json";

import "./TomlToJson.css";

export default function TomlToJson() {
  const [input, setInput] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const inputInvalid = input !== "" && !isValidToml(input);

  const jsonOutput = useMemo(
    () => (inputInvalid ? "" : tomlToJson(input)),
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
    <ToolIsland className="t2j-tool">
      <ToolPanel labelledBy="t2j-heading" className="t2j-tool__panel">
        <ToolSectionHeading
          title="TOML to JSON"
          titleId="t2j-heading"
          description={
            <ToolHint>
              Paste TOML to convert it into pretty-printed JSON.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="t2j-input"
          label="Your TOML"
          full
          code
          rows={10}
          value={input}
          placeholder="Paste your TOML here..."
          onChange={(event) => setInput(event.target.value)}
          autoFocus
          aria-invalid={inputInvalid || undefined}
        />

        {inputInvalid ? (
          <ToolStatus tone="error" live="polite">
            Provided TOML is not valid.
          </ToolStatus>
        ) : null}

        <ToolTextarea
          id="t2j-output"
          label="JSON from your TOML"
          full
          code
          readOnly
          rows={12}
          value={jsonOutput}
          placeholder="JSON output appears here"
          className="t2j-output"
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

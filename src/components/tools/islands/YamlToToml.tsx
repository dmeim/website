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
import { isValidYaml, yamlToToml } from "@/lib/tools/yaml-to-toml";

import "./YamlToToml.css";

export default function YamlToToml() {
  const [input, setInput] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const inputInvalid = input !== "" && !isValidYaml(input);

  const tomlOutput = useMemo(
    () => (inputInvalid ? "" : yamlToToml(input)),
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
    <ToolIsland className="y2t-tool">
      <ToolPanel labelledBy="y2t-heading" className="y2t-tool__panel">
        <ToolSectionHeading
          title="YAML to TOML"
          titleId="y2t-heading"
          description={
            <ToolHint>
              Paste YAML to convert it into TOML. Nested maps become TOML tables.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="y2t-input"
          label="Your YAML"
          full
          code
          rows={10}
          value={input}
          placeholder="Paste your YAML here..."
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
          id="y2t-output"
          label="TOML from your YAML"
          full
          code
          readOnly
          rows={12}
          value={tomlOutput}
          placeholder="TOML output appears here"
          className="y2t-output"
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

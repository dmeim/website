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
import { isValidToml, tomlToYaml } from "@/lib/tools/toml-to-yaml";

import "./TomlToYaml.css";

export default function TomlToYaml() {
  const [input, setInput] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const inputInvalid = input !== "" && !isValidToml(input);

  const yamlOutput = useMemo(
    () => (inputInvalid ? "" : tomlToYaml(input)),
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
    <ToolIsland className="t2y-tool">
      <ToolPanel labelledBy="t2y-heading" className="t2y-tool__panel">
        <ToolSectionHeading
          title="TOML to YAML"
          titleId="t2y-heading"
          description={
            <ToolHint>
              Paste TOML to convert it into YAML.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="t2y-input"
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
          id="t2y-output"
          label="YAML from your TOML"
          full
          code
          readOnly
          rows={12}
          value={yamlOutput}
          placeholder="YAML output appears here"
          className="t2y-output"
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

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
  DEFAULT_INDENT_SIZE,
  DEFAULT_RAW_YAML,
  DEFAULT_SORT_KEYS,
  MAX_INDENT_SIZE,
  MIN_INDENT_SIZE,
  clampIndentSize,
  formatYaml,
  isValidYaml,
} from "@/lib/tools/yaml-prettify";

import "./YamlPrettify.css";

export default function YamlPrettify() {
  const [rawYaml, setRawYaml] = useState(DEFAULT_RAW_YAML);
  const [sortKeys, setSortKeys] = useState(DEFAULT_SORT_KEYS);
  const [indentSize, setIndentSize] = useState(DEFAULT_INDENT_SIZE);
  const [actionStatus, setActionStatus] = useState("");

  const inputInvalid = rawYaml !== "" && !isValidYaml(rawYaml);

  const prettified = useMemo(
    () =>
      inputInvalid
        ? ""
        : formatYaml({ rawYaml, sortKeys, indentSize }),
    [rawYaml, sortKeys, indentSize, inputInvalid],
  );

  const copyPrettified = useCallback(async () => {
    if (!prettified) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(prettified);
      setActionStatus("Prettified YAML copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [prettified]);

  return (
    <ToolIsland className="yp-tool">
      <ToolPanel labelledBy="yp-heading" className="yp-tool__panel">
        <ToolSectionHeading
          title="YAML prettify"
          titleId="yp-heading"
          description={
            <ToolHint>
              Paste YAML to format it. Optionally sort keys and set indent
              size.
            </ToolHint>
          }
        />

        <ToolFormGrid className="yp-settings">
          <ToolCheck
            id="yp-sort-keys"
            label="Sort keys"
            toggle
            checked={sortKeys}
            onChange={(event) => setSortKeys(event.target.checked)}
          />
          <ToolInput
            id="yp-indent"
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
          id="yp-input"
          label="Your raw YAML"
          full
          code
          rows={12}
          value={rawYaml}
          placeholder="Paste your raw YAML here..."
          onChange={(event) => setRawYaml(event.target.value)}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          aria-invalid={inputInvalid || undefined}
        />

        {inputInvalid ? (
          <ToolStatus tone="error" live="polite">
            Provided YAML is not valid.
          </ToolStatus>
        ) : null}

        <ToolTextarea
          id="yp-output"
          label="Prettified version of your YAML"
          full
          code
          readOnly
          rows={12}
          value={prettified}
          placeholder="Prettified YAML appears here"
          className="yp-output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyPrettified()}
            disabled={!prettified}
          >
            Copy YAML
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}

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
  DEFAULT_RAW_JSON,
  DEFAULT_SORT_KEYS,
  MAX_INDENT_SIZE,
  MIN_INDENT_SIZE,
  clampIndentSize,
  formatJson,
  isValidJson,
} from "@/lib/tools/json-prettify";

import "./JsonPrettify.css";

export default function JsonPrettify() {
  const [rawJson, setRawJson] = useState(DEFAULT_RAW_JSON);
  const [sortKeys, setSortKeys] = useState(DEFAULT_SORT_KEYS);
  const [indentSize, setIndentSize] = useState(DEFAULT_INDENT_SIZE);
  const [actionStatus, setActionStatus] = useState("");

  const inputInvalid = rawJson !== "" && !isValidJson(rawJson);

  const prettified = useMemo(
    () =>
      inputInvalid
        ? ""
        : formatJson({ rawJson, sortKeys, indentSize }),
    [rawJson, sortKeys, indentSize, inputInvalid],
  );

  const copyPrettified = useCallback(async () => {
    if (!prettified) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(prettified);
      setActionStatus("Prettified JSON copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [prettified]);

  return (
    <ToolIsland className="jp-tool">
      <ToolPanel labelledBy="jp-heading" className="jp-tool__panel">
        <ToolSectionHeading
          title="JSON prettify"
          titleId="jp-heading"
          description={
            <ToolHint>
              Paste JSON to format it. JSON5 syntax (unquoted keys, trailing
              commas) is accepted. Optionally sort keys and set indent size.
            </ToolHint>
          }
        />

        <ToolFormGrid className="jp-settings">
          <ToolCheck
            id="jp-sort-keys"
            label="Sort keys"
            toggle
            checked={sortKeys}
            onChange={(event) => setSortKeys(event.target.checked)}
          />
          <ToolInput
            id="jp-indent"
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
          id="jp-input"
          label="Your raw JSON"
          full
          code
          rows={12}
          value={rawJson}
          placeholder="Paste your raw JSON here..."
          onChange={(event) => setRawJson(event.target.value)}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          aria-invalid={inputInvalid || undefined}
        />

        {inputInvalid ? (
          <ToolStatus tone="error" live="polite">
            Provided JSON is not valid.
          </ToolStatus>
        ) : null}

        <ToolTextarea
          id="jp-output"
          label="Prettified version of your JSON"
          full
          code
          readOnly
          rows={12}
          value={prettified}
          placeholder="Prettified JSON appears here"
          className="jp-output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyPrettified()}
            disabled={!prettified}
          >
            Copy JSON
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}

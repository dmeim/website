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
import {
  DEFAULT_RAW_JSON,
  isValidJson,
  minifyJson,
} from "@/lib/tools/json-minify";

import "./JsonMinify.css";

export default function JsonMinify() {
  const [rawJson, setRawJson] = useState(DEFAULT_RAW_JSON);
  const [actionStatus, setActionStatus] = useState("");

  const inputInvalid = rawJson !== "" && !isValidJson(rawJson);

  const minified = useMemo(
    () => (inputInvalid ? "" : minifyJson(rawJson)),
    [rawJson, inputInvalid],
  );

  const copyMinified = useCallback(async () => {
    if (!minified) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(minified);
      setActionStatus("Minified JSON copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [minified]);

  return (
    <ToolIsland className="jm-tool">
      <ToolPanel labelledBy="jm-heading" className="jm-tool__panel">
        <ToolSectionHeading
          title="JSON minify"
          titleId="jm-heading"
          description={
            <ToolHint>
              Paste JSON to remove whitespace. JSON5 syntax (unquoted keys,
              trailing commas) is accepted.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="jm-input"
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
          id="jm-output"
          label="Minified version of your JSON"
          full
          code
          readOnly
          rows={8}
          value={minified}
          placeholder="Minified JSON appears here"
          className="jm-output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyMinified()}
            disabled={!minified}
          >
            Copy JSON
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}

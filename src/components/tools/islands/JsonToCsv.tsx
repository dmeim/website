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
  jsonToCsv,
} from "@/lib/tools/json-to-csv";

import "./JsonToCsv.css";

export default function JsonToCsv() {
  const [rawJson, setRawJson] = useState(DEFAULT_RAW_JSON);
  const [actionStatus, setActionStatus] = useState("");

  const inputInvalid = rawJson !== "" && !isValidJson(rawJson);

  const csv = useMemo(
    () => (inputInvalid ? "" : jsonToCsv(rawJson)),
    [rawJson, inputInvalid],
  );

  const copyCsv = useCallback(async () => {
    if (!csv) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(csv);
      setActionStatus("CSV copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [csv]);

  return (
    <ToolIsland className="jtc-tool">
      <ToolPanel labelledBy="jtc-heading" className="jtc-tool__panel">
        <ToolSectionHeading
          title="JSON to CSV"
          titleId="jtc-heading"
          description={
            <ToolHint>
              Paste a JSON array of objects. Headers are collected automatically.
              JSON5 syntax (unquoted keys, trailing commas) is accepted.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="jtc-input"
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
          id="jtc-output"
          label="CSV version of your JSON"
          full
          code
          readOnly
          rows={8}
          value={csv}
          placeholder="CSV appears here"
          className="jtc-output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyCsv()}
            disabled={!csv}
          >
            Copy CSV
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}

import { useMemo, useState } from "react";

import { Panel, ToolFrame, TransformPanel } from "@/ui/react";
import { DEFAULT_RAW_JSON, getJsonError, jsonToCsv } from "@/lib/tools/json-to-csv";

export default function JsonToCsv() {
  const [rawJson, setRawJson] = useState(DEFAULT_RAW_JSON);

  const inputError = getJsonError(rawJson);
  const inputInvalid = inputError !== null;

  const output = useMemo(
    () => (inputInvalid ? "" : jsonToCsv(rawJson)),
    [rawJson, inputInvalid],
  );

  return (
    <ToolFrame>
      <Panel title="JSON to CSV" description="Paste a JSON array of objects. Headers are collected automatically, and nested values are written as JSON. JSON5 syntax (unquoted keys, trailing commas) is accepted.">
        <TransformPanel
          input={{
            label: "Your raw JSON",
            value: rawJson,
            onChange: setRawJson,
            placeholder: "Paste your raw JSON here…",
            mono: true,
            rows: 12,
          }}
          output={{ label: "CSV version of your JSON", value: output, mono: true, rows: 8 }}
          error={inputError ?? undefined}
        />
      </Panel>
    </ToolFrame>
  );
}

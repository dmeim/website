import { useMemo, useState } from "react";

import { Panel, ToolFrame, TransformPanel } from "@/ui/react";
import { DEFAULT_RAW_JSON, getJsonError, minifyJson } from "@/lib/tools/json-minify";

export default function JsonMinify() {
  const [rawJson, setRawJson] = useState(DEFAULT_RAW_JSON);

  const inputError = getJsonError(rawJson);
  const inputInvalid = inputError !== null;

  const output = useMemo(
    () => (inputInvalid ? "" : minifyJson(rawJson)),
    [rawJson, inputInvalid],
  );

  return (
    <ToolFrame>
      <Panel title="JSON minify" description="Paste JSON to remove whitespace. JSON5 syntax (unquoted keys, trailing commas) is accepted.">
        <TransformPanel
          input={{
            label: "Your raw JSON",
            value: rawJson,
            onChange: setRawJson,
            placeholder: "Paste your raw JSON here…",
            mono: true,
            rows: 12,
          }}
          output={{ label: "Minified version of your JSON", value: output, mono: true, rows: 8 }}
          error={inputError ?? undefined}
        />
      </Panel>
    </ToolFrame>
  );
}

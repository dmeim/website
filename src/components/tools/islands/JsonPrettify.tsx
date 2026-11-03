import { useMemo, useState } from "react";

import { FormGrid, Input, Panel, Switch, ToolFrame, TransformPanel } from "@/ui/react";
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

export default function JsonPrettify() {
  const [rawJson, setRawJson] = useState(DEFAULT_RAW_JSON);
  const [sortKeys, setSortKeys] = useState(DEFAULT_SORT_KEYS);
  const [indentSize, setIndentSize] = useState(DEFAULT_INDENT_SIZE);

  const inputInvalid = rawJson !== "" && !isValidJson(rawJson);

  const output = useMemo(
    () => (inputInvalid ? "" : formatJson({ rawJson, sortKeys, indentSize })),
    [rawJson, sortKeys, indentSize, inputInvalid],
  );

  return (
    <ToolFrame>
      <Panel
        title="JSON prettify"
        description="Paste JSON to format it. JSON5 syntax (unquoted keys, trailing commas) is accepted. Optionally sort keys and set indent size."
      >
        <TransformPanel
          input={{
            label: "Your raw JSON",
            value: rawJson,
            onChange: setRawJson,
            placeholder: "Paste your raw JSON here…",
            mono: true,
            rows: 12,
          }}
          output={{ label: "Prettified version of your JSON", value: output, mono: true, rows: 12 }}
          error={inputInvalid ? "Provided JSON is not valid." : undefined}
          options={
            <FormGrid columns={2}>
              <Switch
                id="jp-sort-keys"
                label="Sort keys"
                checked={sortKeys}
                onChange={(event) => setSortKeys(event.target.checked)}
              />
              <Input
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
            </FormGrid>
          }
        />
      </Panel>
    </ToolFrame>
  );
}

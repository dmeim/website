import { useMemo, useState } from "react";

import { useStoredState } from "@/components/tools/use-persisted-state";
import { FormGrid, Input, Panel, Switch, ToolFrame, TransformPanel } from "@/ui/react";
import {
  DEFAULT_INDENT_SIZE,
  DEFAULT_RAW_JSON,
  DEFAULT_SORT_KEYS,
  MAX_INDENT_SIZE,
  MIN_INDENT_SIZE,
  clampIndentSize,
  formatJson,
  getJsonError,
} from "@/lib/tools/json-prettify";

export default function JsonPrettify() {
  const [rawJson, setRawJson] = useState(DEFAULT_RAW_JSON);
  const [sortKeys, setSortKeys] = useStoredState("json-prettify:sort-keys", DEFAULT_SORT_KEYS);
  const [indentSize, setIndentSize] = useStoredState(
    "json-prettify:indent-size",
    DEFAULT_INDENT_SIZE,
    (value) => clampIndentSize(value) === value,
  );
  // The field can be empty mid-edit while the last valid size keeps formatting.
  const [indentDraft, setIndentDraft] = useState(String(indentSize));

  const inputError = getJsonError(rawJson);
  const inputInvalid = inputError !== null;

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
          error={inputError ?? undefined}
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
                value={indentDraft}
                onChange={(event) => {
                  setIndentDraft(event.target.value);
                  const next = event.target.valueAsNumber;
                  if (!Number.isNaN(next)) setIndentSize(clampIndentSize(next));
                }}
                onBlur={() => setIndentDraft(String(indentSize))}
              />
            </FormGrid>
          }
        />
      </Panel>
    </ToolFrame>
  );
}

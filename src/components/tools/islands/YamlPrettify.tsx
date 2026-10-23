import { useMemo, useState } from "react";

import { FormGrid, Input, Panel, Switch, ToolFrame, TransformPanel } from "@/ui/react";
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

export default function YamlPrettify() {
  const [rawYaml, setRawYaml] = useState(DEFAULT_RAW_YAML);
  const [sortKeys, setSortKeys] = useState(DEFAULT_SORT_KEYS);
  const [indentSize, setIndentSize] = useState(DEFAULT_INDENT_SIZE);

  const inputInvalid = rawYaml !== "" && !isValidYaml(rawYaml);

  const output = useMemo(
    () => (inputInvalid ? "" : formatYaml({ rawYaml, sortKeys, indentSize })),
    [rawYaml, sortKeys, indentSize, inputInvalid],
  );

  return (
    <ToolFrame>
      <Panel
        title="YAML prettify"
        description="Paste YAML to format it. Optionally sort keys and set indent size."
      >
        <TransformPanel
          input={{
            label: "Your raw YAML",
            value: rawYaml,
            onChange: setRawYaml,
            placeholder: "Paste your raw YAML here...",
            mono: true,
            rows: 12,
          }}
          output={{ label: "Prettified version of your YAML", value: output, mono: true, rows: 12 }}
          error={inputInvalid ? "Provided YAML is not valid." : undefined}
          options={
            <FormGrid columns={2}>
              <Switch
                id="yp-sort-keys"
                label="Sort keys"
                checked={sortKeys}
                onChange={(event) => setSortKeys(event.target.checked)}
              />
              <Input
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
            </FormGrid>
          }
        />
      </Panel>
    </ToolFrame>
  );
}

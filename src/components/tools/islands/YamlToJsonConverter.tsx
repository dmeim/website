import { useMemo, useState } from "react";

import { Panel, ToolFrame, TransformPanel } from "@/ui/react";
import { getYamlToJsonError, yamlToJson } from "@/lib/tools/yaml-to-json-converter";

export default function YamlToJsonConverter() {
  const [input, setInput] = useState("");

  const error = useMemo(() => getYamlToJsonError(input), [input]);

  const output = useMemo(
    () => (error ? "" : yamlToJson(input)),
    [input, error],
  );

  return (
    <ToolFrame>
      <Panel title="YAML to JSON" description="Paste YAML to convert it into pretty-printed JSON. Merge keys and anchors are supported.">
        <TransformPanel
          input={{
            label: "Your YAML",
            value: input,
            onChange: setInput,
            placeholder: "Paste your YAML here…",
            mono: true,
            rows: 10,
          }}
          output={{ label: "JSON from your YAML", value: output, mono: true, rows: 12 }}
          error={error ?? undefined}
        />
      </Panel>
    </ToolFrame>
  );
}

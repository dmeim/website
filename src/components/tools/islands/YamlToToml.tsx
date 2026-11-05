import { useMemo, useState } from "react";

import { Panel, ToolFrame, TransformPanel } from "@/ui/react";
import { getYamlToTomlError, yamlToToml } from "@/lib/tools/yaml-to-toml";

export default function YamlToToml() {
  const [input, setInput] = useState("");

  const error = useMemo(() => getYamlToTomlError(input), [input]);

  const output = useMemo(
    () => (error ? "" : yamlToToml(input)),
    [input, error],
  );

  return (
    <ToolFrame>
      <Panel title="YAML to TOML" description="Paste YAML to convert it into TOML. Nested maps become TOML tables.">
        <TransformPanel
          input={{
            label: "Your YAML",
            value: input,
            onChange: setInput,
            placeholder: "Paste your YAML here…",
            mono: true,
            rows: 10,
          }}
          output={{ label: "TOML from your YAML", value: output, mono: true, rows: 12 }}
          error={error ?? undefined}
        />
      </Panel>
    </ToolFrame>
  );
}

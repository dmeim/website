import { useMemo, useState } from "react";

import { Panel, ToolFrame, TransformPanel } from "@/ui/react";
import { isValidYaml, yamlToToml } from "@/lib/tools/yaml-to-toml";

export default function YamlToToml() {
  const [input, setInput] = useState("");

  const inputInvalid = input !== "" && !isValidYaml(input);

  const output = useMemo(
    () => (inputInvalid ? "" : yamlToToml(input)),
    [input, inputInvalid],
  );

  return (
    <ToolFrame>
      <Panel title="YAML to TOML" description="Paste YAML to convert it into TOML. Nested maps become TOML tables.">
        <TransformPanel
          input={{
            label: "Your YAML",
            value: input,
            onChange: setInput,
            placeholder: "Paste your YAML here...",
            mono: true,
            rows: 10,
          }}
          output={{ label: "TOML from your YAML", value: output, mono: true, rows: 12 }}
          error={inputInvalid ? "Provided YAML is not valid." : undefined}
        />
      </Panel>
    </ToolFrame>
  );
}

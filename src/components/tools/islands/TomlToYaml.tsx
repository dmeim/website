import { useMemo, useState } from "react";

import { Panel, ToolFrame, TransformPanel } from "@/ui/react";
import { isValidToml, tomlToYaml } from "@/lib/tools/toml-to-yaml";

export default function TomlToYaml() {
  const [input, setInput] = useState("");

  const inputInvalid = input !== "" && !isValidToml(input);

  const output = useMemo(
    () => (inputInvalid ? "" : tomlToYaml(input)),
    [input, inputInvalid],
  );

  return (
    <ToolFrame>
      <Panel title="TOML to YAML" description="Paste TOML to convert it into YAML.">
        <TransformPanel
          input={{
            label: "Your TOML",
            value: input,
            onChange: setInput,
            placeholder: "Paste your TOML here…",
            mono: true,
            rows: 10,
          }}
          output={{ label: "YAML from your TOML", value: output, mono: true, rows: 12 }}
          error={inputInvalid ? "Provided TOML is not valid." : undefined}
        />
      </Panel>
    </ToolFrame>
  );
}

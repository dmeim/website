import { useMemo, useState } from "react";

import { Panel, ToolFrame, TransformPanel } from "@/ui/react";
import { isValidToml, tomlToJson } from "@/lib/tools/toml-to-json";

export default function TomlToJson() {
  const [input, setInput] = useState("");

  const inputInvalid = input !== "" && !isValidToml(input);

  const output = useMemo(
    () => (inputInvalid ? "" : tomlToJson(input)),
    [input, inputInvalid],
  );

  return (
    <ToolFrame>
      <Panel title="TOML to JSON" description="Paste TOML to convert it into pretty-printed JSON.">
        <TransformPanel
          input={{
            label: "Your TOML",
            value: input,
            onChange: setInput,
            placeholder: "Paste your TOML here...",
            mono: true,
            rows: 10,
          }}
          output={{ label: "JSON from your TOML", value: output, mono: true, rows: 12 }}
          error={inputInvalid ? "Provided TOML is not valid." : undefined}
        />
      </Panel>
    </ToolFrame>
  );
}

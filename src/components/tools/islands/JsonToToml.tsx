import { useMemo, useState } from "react";

import { Panel, ToolFrame, TransformPanel } from "@/ui/react";
import { isValidJson, jsonToToml } from "@/lib/tools/json-to-toml";

export default function JsonToToml() {
  const [input, setInput] = useState("");

  const inputInvalid = input !== "" && !isValidJson(input);

  const output = useMemo(
    () => (inputInvalid ? "" : jsonToToml(input)),
    [input, inputInvalid],
  );

  return (
    <ToolFrame>
      <Panel title="JSON to TOML" description="Paste JSON to convert it into TOML. JSON5 syntax (unquoted keys, trailing commas) is accepted.">
        <TransformPanel
          input={{
            label: "Your JSON",
            value: input,
            onChange: setInput,
            placeholder: "Paste your JSON here...",
            mono: true,
            rows: 10,
          }}
          output={{ label: "TOML from your JSON", value: output, mono: true, rows: 12 }}
          error={inputInvalid ? "Provided JSON is not valid." : undefined}
        />
      </Panel>
    </ToolFrame>
  );
}

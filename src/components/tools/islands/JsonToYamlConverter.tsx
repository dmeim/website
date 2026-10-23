import { useMemo, useState } from "react";

import { Panel, ToolFrame, TransformPanel } from "@/ui/react";
import { isValidJson, jsonToYaml } from "@/lib/tools/json-to-yaml-converter";

export default function JsonToYamlConverter() {
  const [input, setInput] = useState("");

  const inputInvalid = input !== "" && !isValidJson(input);

  const output = useMemo(
    () => (inputInvalid ? "" : jsonToYaml(input)),
    [input, inputInvalid],
  );

  return (
    <ToolFrame>
      <Panel title="JSON to YAML" description="Paste JSON to convert it into YAML. JSON5 syntax (unquoted keys, trailing commas) is accepted.">
        <TransformPanel
          input={{
            label: "Your JSON",
            value: input,
            onChange: setInput,
            placeholder: "Paste your JSON here...",
            mono: true,
            rows: 10,
          }}
          output={{ label: "YAML from your JSON", value: output, mono: true, rows: 12 }}
          error={inputInvalid ? "Provided JSON is not valid." : undefined}
        />
      </Panel>
    </ToolFrame>
  );
}

import { useMemo, useState } from "react";

import { Panel, ToolFrame, TransformPanel } from "@/ui/react";
import { isValidJson, jsonToXml } from "@/lib/tools/json-to-xml";

export default function JsonToXml() {
  const [input, setInput] = useState("");

  const inputInvalid = input !== "" && !isValidJson(input);

  const output = useMemo(
    () => (inputInvalid ? "" : jsonToXml(input)),
    [input, inputInvalid],
  );

  return (
    <ToolFrame>
      <Panel title="JSON to XML" description="Paste JSON to convert it into compact XML. JSON5 syntax (unquoted keys, trailing commas) is accepted.">
        <TransformPanel
          input={{
            label: "Your JSON content",
            value: input,
            onChange: setInput,
            placeholder: "Paste your JSON content here...",
            mono: true,
            rows: 10,
          }}
          output={{ label: "Converted XML", value: output, mono: true, rows: 12 }}
          error={inputInvalid ? "Provided JSON is not valid." : undefined}
        />
      </Panel>
    </ToolFrame>
  );
}

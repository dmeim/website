import { useMemo, useState } from "react";

import { Panel, ToolFrame, TransformPanel } from "@/ui/react";
import { isValidXml, xmlToJson } from "@/lib/tools/xml-to-json";

export default function XmlToJson() {
  const [input, setInput] = useState("");

  const inputInvalid = input !== "" && !isValidXml(input);

  const output = useMemo(
    () => (inputInvalid ? "" : xmlToJson(input)),
    [input, inputInvalid],
  );

  return (
    <ToolFrame>
      <Panel title="XML to JSON" description="Paste XML to convert it into pretty-printed JSON.">
        <TransformPanel
          input={{
            label: "Your XML content",
            value: input,
            onChange: setInput,
            placeholder: "Paste your XML content here…",
            mono: true,
            rows: 10,
          }}
          output={{ label: "Converted JSON", value: output, mono: true, rows: 12 }}
          error={inputInvalid ? "Provided XML is not valid." : undefined}
        />
      </Panel>
    </ToolFrame>
  );
}

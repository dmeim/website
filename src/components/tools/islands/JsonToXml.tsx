import { useMemo, useState } from "react";

import { Panel, ToolFrame, TransformPanel } from "@/ui/react";
import { DEFAULT_JSON, getJsonToXmlError, jsonToXml } from "@/lib/tools/json-to-xml";

export default function JsonToXml() {
  const [input, setInput] = useState(DEFAULT_JSON);

  const error = useMemo(() => getJsonToXmlError(input), [input]);

  const output = useMemo(
    () => (error ? "" : jsonToXml(input)),
    [input, error],
  );

  return (
    <ToolFrame>
      <Panel title="JSON to XML" description="Paste JSON to convert it into compact XML. JSON5 syntax (unquoted keys, trailing commas) is accepted.">
        <TransformPanel
          input={{
            label: "Your JSON content",
            value: input,
            onChange: setInput,
            placeholder: "Paste your JSON content here…",
            mono: true,
            rows: 10,
          }}
          output={{ label: "Converted XML", value: output, mono: true, rows: 12 }}
          error={error ?? undefined}
        />
      </Panel>
    </ToolFrame>
  );
}

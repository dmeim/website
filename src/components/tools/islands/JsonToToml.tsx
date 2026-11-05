import { useMemo, useState } from "react";

import { Panel, ToolFrame, TransformPanel } from "@/ui/react";
import { getJsonToTomlError, jsonToToml } from "@/lib/tools/json-to-toml";

export default function JsonToToml() {
  const [input, setInput] = useState("");

  const error = useMemo(() => getJsonToTomlError(input), [input]);

  const output = useMemo(
    () => (error ? "" : jsonToToml(input)),
    [input, error],
  );

  return (
    <ToolFrame>
      <Panel title="JSON to TOML" description="Paste JSON to convert it into TOML. JSON5 syntax (unquoted keys, trailing commas) is accepted.">
        <TransformPanel
          input={{
            label: "Your JSON",
            value: input,
            onChange: setInput,
            placeholder: "Paste your JSON here…",
            mono: true,
            rows: 10,
          }}
          output={{ label: "TOML from your JSON", value: output, mono: true, rows: 12 }}
          error={error ?? undefined}
        />
      </Panel>
    </ToolFrame>
  );
}

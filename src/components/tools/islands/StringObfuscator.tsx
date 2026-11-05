import { useMemo, useState } from "react";

import { FormGrid, Input, Panel, Switch, ToolFrame, TransformPanel } from "@/ui/react";
import { obfuscateString } from "@/lib/tools/string-obfuscator";

function parseKeepCount(raw: string): number {
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export default function StringObfuscator() {
  const [text, setText] = useState("Lorem ipsum dolor sit amet");
  const [keepFirstRaw, setKeepFirstRaw] = useState("4");
  const [keepLastRaw, setKeepLastRaw] = useState("4");
  const [keepSpace, setKeepSpace] = useState(true);

  const keepFirst = parseKeepCount(keepFirstRaw);
  const keepLast = parseKeepCount(keepLastRaw);

  const obfuscated = useMemo(
    () => obfuscateString(text, { keepFirst, keepLast, keepSpace }),
    [text, keepFirst, keepLast, keepSpace],
  );

  return (
    <ToolFrame>
      <Panel
        title="String obfuscator"
        description="Mask the middle of a secret, token, or IBAN while keeping ends (and spaces) visible for identification."
      >
        <TransformPanel
          input={{
            label: "String to obfuscate",
            value: text,
            onChange: setText,
            placeholder: "Enter string to obfuscate",
            rows: 4,
          }}
          options={
            <FormGrid columns={3}>
              <Input
                label="Keep first"
                type="number"
                min={0}
                step={1}
                value={keepFirstRaw}
                onChange={(event) => setKeepFirstRaw(event.target.value)}
              />
              <Input
                label="Keep last"
                type="number"
                min={0}
                step={1}
                value={keepLastRaw}
                onChange={(event) => setKeepLastRaw(event.target.value)}
              />
              <Switch
                label="Keep spaces"
                checked={keepSpace}
                onChange={(event) => setKeepSpace(event.target.checked)}
              />
            </FormGrid>
          }
          output={{ label: "Obfuscated string", value: obfuscated, mono: true, rows: 2 }}
        />
      </Panel>
    </ToolFrame>
  );
}

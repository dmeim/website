import { useMemo, useState } from "react";

import { Input, KeyValue, Panel, ToolFrame } from "@/ui/react";
import { DEFAULT_CASE_INPUT, convertAllCases } from "@/lib/tools/case-converter";

export default function CaseConverter() {
  const [input, setInput] = useState(DEFAULT_CASE_INPUT);

  const formats = useMemo(() => convertAllCases(input), [input]);

  return (
    <ToolFrame>
      <Panel
        title="Case converter"
        description="Type a string to see camel, snake, kebab, Pascal, constant, and other formats update live — then copy any result."
      >
        <Input
          label="Your string"
          value={input}
          placeholder="Your string…"
          onChange={(event) => setInput(event.target.value)}
          autoFocus
        />
        <KeyValue
          aria-label="Case formats"
          aria-live="polite"
          items={formats.map((format) => ({
            label: format.label,
            value: format.value,
            mono: true,
            copy: format.value ? format.value : false,
          }))}
        />
      </Panel>
    </ToolFrame>
  );
}

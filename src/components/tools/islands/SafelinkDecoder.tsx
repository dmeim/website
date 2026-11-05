import { useMemo, useState } from "react";

import { Code, Input, Notice, OutputField, Panel, ToolFrame } from "@/ui/react";
import { decodeSafeLinksURLSafe } from "@/lib/tools/safelink-decoder";

export default function SafelinkDecoder() {
  const [input, setInput] = useState("");

  const result = useMemo(() => decodeSafeLinksURLSafe(input), [input]);
  const output = result.ok ? result.url : "";

  return (
    <ToolFrame>
      <Panel
        title="Outlook SafeLink decoder"
        description={
          <>
            Paste an Outlook SafeLink URL to extract the original destination from the{" "}
            <Code>url</Code> query parameter.
          </>
        }
      >
        <Input
          label="Your Outlook SafeLink URL"
          value={input}
          placeholder="Your input Outlook SafeLink URL…"
          spellCheck={false}
          autoFocus
          onChange={(event) => setInput(event.target.value)}
          aria-invalid={!result.ok || undefined}
        />
        {!result.ok ? (
          <Notice tone="danger" variant="inline" live="polite">
            {result.error}
          </Notice>
        ) : null}
        <OutputField
          label="Output decoded URL"
          value={output}
          multiline
          rows={3}
          placeholder="Decoded destination URL"
        />
      </Panel>
    </ToolFrame>
  );
}

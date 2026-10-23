import { useMemo, useState } from "react";

import { Panel, StatGrid, Textarea, ToolFrame } from "@/ui/react";
import { getTextStatistics } from "@/lib/tools/text-statistics";

export default function TextStatistics() {
  const [text, setText] = useState("");

  const stats = useMemo(() => getTextStatistics(text), [text]);

  const items = [
    { label: "Character count", value: stats.characterCount },
    { label: "Word count", value: stats.wordCount },
    { label: "Line count", value: stats.lineCount },
    { label: "Byte size", value: stats.byteSizeFormatted },
  ];

  return (
    <ToolFrame>
      <Panel
        title="Text statistics"
        titleId="text-stats-heading"
        description="Paste or type text to see character, word, line, and UTF-8 byte counts."
      >
        <Textarea
          id="text-stats-input"
          label="Text"
          rows={5}
          value={text}
          placeholder="Your text..."
          onChange={(event) => setText(event.target.value)}
          autoFocus
          spellCheck={false}
        />

        <StatGrid columns={4} aria-live="polite" items={items} />
      </Panel>
    </ToolFrame>
  );
}

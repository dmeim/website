import { useMemo, useState } from "react";

import {
  ToolHint,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolTextarea,
} from "@/components/tools/ui";
import { getTextStatistics } from "@/lib/tools/text-statistics";

import "./TextStatistics.css";

export default function TextStatistics() {
  const [text, setText] = useState("");

  const stats = useMemo(() => getTextStatistics(text), [text]);

  const items = [
    { label: "Character count", value: stats.characterCount },
    { label: "Word count", value: stats.wordCount },
    { label: "Line count", value: stats.lineCount },
    { label: "Byte size", value: stats.byteSizeFormatted },
  ] as const;

  return (
    <ToolIsland className="text-stats-tool">
      <ToolPanel labelledBy="text-stats-heading" className="text-stats-tool__panel">
        <ToolSectionHeading
          title="Text statistics"
          titleId="text-stats-heading"
          description={
            <ToolHint>
              Paste or type text to see character, word, line, and UTF-8 byte counts.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="text-stats-input"
          label="Text"
          full
          rows={5}
          value={text}
          placeholder="Your text..."
          onChange={(event) => setText(event.target.value)}
          autoFocus
          spellCheck={false}
        />

        <dl className="text-stats-grid" aria-live="polite">
          {items.map(({ label, value }) => (
            <div key={label} className="text-stats-grid__item">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </ToolPanel>
    </ToolIsland>
  );
}

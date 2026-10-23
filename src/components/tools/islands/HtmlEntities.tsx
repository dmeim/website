import { useMemo, useState } from "react";

import { Code, Panel, ToolFrame, TransformPanel } from "@/ui/react";
import { escapeHtml, unescapeHtml } from "@/lib/tools/html-entities";

export default function HtmlEntities() {
  const [escapeInput, setEscapeInput] = useState("<title>IT Tool</title>");
  const [unescapeInput, setUnescapeInput] = useState("&lt;title&gt;IT Tool&lt;/title&gt;");

  const escapeOutput = useMemo(() => escapeHtml(escapeInput), [escapeInput]);
  const unescapeOutput = useMemo(() => unescapeHtml(unescapeInput), [unescapeInput]);

  return (
    <ToolFrame layout="split" stagger>
      <Panel
        title="Escape"
        description={
          <>
            Replace <Code>&amp;</Code>, <Code>&lt;</Code>, <Code>&gt;</Code>,{" "}
            <Code>&quot;</Code>, and <Code>&#39;</Code> with HTML entities.
          </>
        }
      >
        <TransformPanel
          input={{
            label: "Your string",
            value: escapeInput,
            onChange: setEscapeInput,
            placeholder: "The string to escape",
            rows: 3,
          }}
          output={{ label: "Your string escaped", value: escapeOutput, mono: true, rows: 3 }}
        />
      </Panel>

      <Panel
        title="Unescape"
        description={
          <>
            Decode <Code>&amp;amp;</Code>, <Code>&amp;lt;</Code>, <Code>&amp;gt;</Code>,{" "}
            <Code>&amp;quot;</Code>, and <Code>&amp;#39;</Code> back to characters.
          </>
        }
      >
        <TransformPanel
          input={{
            label: "Your escaped string",
            value: unescapeInput,
            onChange: setUnescapeInput,
            placeholder: "The string to unescape",
            mono: true,
            rows: 3,
          }}
          output={{ label: "Your string unescaped", value: unescapeOutput, rows: 3 }}
        />
      </Panel>
    </ToolFrame>
  );
}

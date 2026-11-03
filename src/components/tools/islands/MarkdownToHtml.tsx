import { useCallback, useMemo, useState } from "react";

import { Button, Notice, Panel, Prose, ToolFrame, TransformPanel } from "@/ui/react";
import { markdownToHtml } from "@/lib/tools/markdown-to-html";

export default function MarkdownToHtml() {
  const [input, setInput] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const htmlOutput = useMemo(() => markdownToHtml(input), [input]);

  const printHtml = useCallback(() => {
    if (!htmlOutput) {
      setActionStatus("Nothing to print yet.");
      return;
    }

    const w = window.open();
    if (w === null) {
      setActionStatus("Pop-up blocked. Allow pop-ups to print.");
      return;
    }

    w.document.body.innerHTML = htmlOutput;
    w.print();
    setActionStatus("Print dialog opened.");
  }, [htmlOutput]);

  return (
    <ToolFrame>
      <Panel
        title="Markdown to HTML"
        description="Paste Markdown to convert it into HTML. Copy the result or print it as a PDF from your browser's print dialog."
      >
        <TransformPanel
          input={{
            label: "Your Markdown to convert",
            value: input,
            onChange: setInput,
            placeholder: "Your Markdown content…",
            mono: true,
            rows: 10,
          }}
          output={{ label: "Output HTML", value: htmlOutput, mono: true, rows: 12 }}
          actions={
            <Button
              variant="ghost"
              iconStart="printer"
              onClick={printHtml}
              disabled={!htmlOutput}
            >
              Print as PDF
            </Button>
          }
        />
        {actionStatus ? <Notice variant="inline" live="polite">{actionStatus}</Notice> : null}
      </Panel>
      {htmlOutput ? (
        <Panel title="Preview">
          <Prose html={htmlOutput} />
        </Panel>
      ) : null}
    </ToolFrame>
  );
}

import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolHint,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolTextarea,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import { markdownToHtml } from "@/lib/tools/markdown-to-html";

import "./MarkdownToHtml.css";

export default function MarkdownToHtml() {
  const [input, setInput] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const htmlOutput = useMemo(() => markdownToHtml(input), [input]);

  const copyHtml = useCallback(async () => {
    if (!htmlOutput) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(htmlOutput);
      setActionStatus("HTML copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [htmlOutput]);

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
    <ToolIsland className="md2h-tool">
      <ToolPanel labelledBy="md2h-heading" className="md2h-tool__panel">
        <ToolSectionHeading
          title="Markdown to HTML"
          titleId="md2h-heading"
          description={
            <ToolHint>
              Paste Markdown to convert it into HTML. Copy the result or print
              it as a PDF from your browser&apos;s print dialog.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="md2h-input"
          label="Your Markdown to convert"
          full
          code
          rows={10}
          value={input}
          placeholder="Your Markdown content..."
          onChange={(event) => setInput(event.target.value)}
          autoFocus
        />

        <ToolTextarea
          id="md2h-output"
          label="Output HTML"
          full
          code
          readOnly
          rows={12}
          value={htmlOutput}
          placeholder="HTML output appears here"
          className="md2h-output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyHtml()}
            disabled={!htmlOutput}
          >
            Copy HTML
          </ToolButton>
          <ToolButton
            type="button"
            variant="ghost"
            onClick={printHtml}
            disabled={!htmlOutput}
          >
            Print as PDF
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}

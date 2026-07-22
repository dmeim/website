import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolTextarea,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import { decodeSafeLinksURLSafe } from "@/lib/tools/safelink-decoder";

import "./SafelinkDecoder.css";

export default function SafelinkDecoder() {
  const [input, setInput] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const result = useMemo(() => decodeSafeLinksURLSafe(input), [input]);
  const invalid = !result.ok;
  const output = result.ok ? result.url : "";

  const copyDecoded = useCallback(async () => {
    if (!output) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(output);
      setActionStatus("Decoded URL copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [output]);

  return (
    <ToolIsland className="safelink-tool">
      <ToolPanel labelledBy="safelink-heading" className="safelink-tool__panel">
        <ToolSectionHeading
          title="Outlook SafeLink decoder"
          titleId="safelink-heading"
          description={
            <ToolHint>
              Paste an Outlook SafeLink URL to extract the original destination
              from the <code>url</code> query parameter.
            </ToolHint>
          }
        />

        <ToolInput
          id="safelink-input"
          label="Your Outlook SafeLink URL"
          full
          value={input}
          placeholder="Your input Outlook SafeLink Url…"
          spellCheck={false}
          autoFocus
          onChange={(event) => {
            setInput(event.target.value);
            setActionStatus("");
          }}
          aria-invalid={invalid || undefined}
        />

        {invalid ? (
          <ToolStatus tone="error" live="polite">
            {result.error}
          </ToolStatus>
        ) : null}

        <ToolTextarea
          id="safelink-output"
          label="Output decoded URL"
          full
          code
          readOnly
          rows={3}
          value={output}
          placeholder="Decoded destination URL"
          className="safelink-output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyDecoded()}
            disabled={!output}
          >
            Copy
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? (
          <ToolStatus tone="success">{actionStatus}</ToolStatus>
        ) : null}
      </ToolPanel>
    </ToolIsland>
  );
}

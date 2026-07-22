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
import { textToNatoAlphabet } from "@/lib/tools/text-to-nato-alphabet";

import "./TextToNatoAlphabet.css";

export default function TextToNatoAlphabet() {
  const [input, setInput] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const natoText = useMemo(() => textToNatoAlphabet(input), [input]);

  const copyNato = useCallback(async () => {
    if (!natoText) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(natoText);
      setActionStatus("NATO alphabet string copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [natoText]);

  return (
    <ToolIsland className="nato-tool">
      <ToolPanel labelledBy="nato-heading" className="nato-tool__panel">
        <ToolSectionHeading
          title="NATO phonetic alphabet"
          titleId="nato-heading"
          description={
            <ToolHint>
              Enter text to convert letters into Alpha…Zulu for clearer oral transmission.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="nato-input"
          label="Your text to convert"
          full
          rows={3}
          value={input}
          placeholder="Put your text here…"
          onChange={(event) => setInput(event.target.value)}
          autoFocus
        />

        <ToolTextarea
          id="nato-output"
          label="NATO phonetic alphabet"
          full
          code
          readOnly
          rows={4}
          value={natoText}
          placeholder="NATO output appears here"
          className="nato-output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton type="button" onClick={() => void copyNato()} disabled={!natoText}>
            Copy
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}

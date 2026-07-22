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
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import { generateNumeronym } from "@/lib/tools/numeronym-generator";

import "./NumeronymGenerator.css";

export default function NumeronymGenerator() {
  const [word, setWord] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const numeronym = useMemo(() => generateNumeronym(word), [word]);

  const copyNumeronym = useCallback(async () => {
    if (!numeronym) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(numeronym);
      setActionStatus("Numeronym copied.");
    } catch {
      setActionStatus("Copy failed. Select the numeronym and copy it manually.");
    }
  }, [numeronym]);

  return (
    <ToolIsland className="numeronym-tool">
      <ToolPanel labelledBy="numeronym-heading" className="numeronym-tool__panel">
        <ToolSectionHeading
          title="Numeronym generator"
          titleId="numeronym-heading"
          description={
            <ToolHint>
              Abbreviate a word as first letter + middle letter count + last letter
              (e.g. internationalization → i18n).
            </ToolHint>
          }
        />

        <ToolInput
          id="numeronym-input"
          label="Word"
          full
          value={word}
          placeholder="Enter a word, e.g. internationalization"
          onChange={(event) => setWord(event.target.value)}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />

        <ToolInput
          id="numeronym-output"
          label="Numeronym"
          full
          readOnly
          value={numeronym}
          placeholder="Your numeronym will be here, e.g. i18n"
          className="numeronym-output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyNumeronym()}
            disabled={!numeronym}
          >
            Copy numeronym
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}

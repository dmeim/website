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
import {
  DEFAULT_RAW_EMAILS,
  normalizeEmails,
} from "@/lib/tools/email-normalizer";

import "./EmailNormalizer.css";

export default function EmailNormalizer() {
  const [rawEmails, setRawEmails] = useState(DEFAULT_RAW_EMAILS);
  const [actionStatus, setActionStatus] = useState("");

  const normalized = useMemo(() => normalizeEmails(rawEmails), [rawEmails]);

  const clearEmails = useCallback(() => {
    setRawEmails(DEFAULT_RAW_EMAILS);
    setActionStatus("");
  }, []);

  const copyNormalized = useCallback(async () => {
    if (!normalized) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(normalized);
      setActionStatus("Normalized emails copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [normalized]);

  return (
    <ToolIsland className="en-tool">
      <ToolPanel labelledBy="en-heading" className="en-tool__panel">
        <ToolSectionHeading
          title="Email normalizer"
          titleId="en-heading"
          description={
            <ToolHint>
              Paste emails one per line to normalize them for comparison and
              deduplication.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="en-input"
          label="Raw emails to normalize"
          full
          code
          rows={6}
          value={rawEmails}
          placeholder="Put your emails here (one per line)..."
          onChange={(event) => setRawEmails(event.target.value)}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />

        <ToolTextarea
          id="en-output"
          label="Normalized emails"
          full
          code
          readOnly
          rows={6}
          value={normalized}
          placeholder="Normalized emails will appear here..."
          className="en-output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton type="button" onClick={clearEmails}>
            Clear emails
          </ToolButton>
          <ToolButton
            type="button"
            onClick={() => void copyNormalized()}
            disabled={!normalized}
          >
            Copy normalized emails
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}

import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolHint,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolSelect,
  ToolStatus,
  ToolTextarea,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  HASH_ALGORITHMS,
  HASH_ENCODING_DEFAULT,
  HASH_ENCODING_OPTIONS,
  type HashAlgorithm,
  type HashEncoding,
  hashAll,
  normalizeHashEncoding,
} from "@/lib/tools/hash-text";

import "./HashText.css";

export default function HashText() {
  const [clearText, setClearText] = useState("");
  const [encoding, setEncoding] = useState<HashEncoding>(HASH_ENCODING_DEFAULT);
  const [actionStatus, setActionStatus] = useState("");

  const safeEncoding = normalizeHashEncoding(encoding);
  const digests = useMemo(() => hashAll(clearText, safeEncoding), [clearText, safeEncoding]);

  const copyDigest = useCallback(async (algo: HashAlgorithm, value: string) => {
    try {
      await copyTextToClipboard(value);
      setActionStatus(`${algo} digest copied.`);
    } catch {
      setActionStatus("Copy failed. Select the digest and copy it manually.");
    }
  }, []);

  return (
    <ToolIsland className="ht-tool">
      <ToolPanel labelledBy="ht-input-heading" className="ht-tool__panel">
        <ToolSectionHeading
          title="Hash text"
          titleId="ht-input-heading"
          description={
            <ToolHint>
              Enter text, pick a digest encoding, then copy any algorithm output.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="ht-clear-text"
          label="Your text to hash"
          full
          rows={3}
          value={clearText}
          placeholder="Your string to hash…"
          onChange={(event) => setClearText(event.target.value)}
          autoFocus
        />

        <ToolSelect
          id="ht-encoding"
          label="Digest encoding"
          full
          value={safeEncoding}
          onChange={(event) => setEncoding(normalizeHashEncoding(event.target.value))}
        >
          {HASH_ENCODING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </ToolSelect>

        <div className="ht-digests" role="list" aria-label="Hash digests">
          {HASH_ALGORITHMS.map((algo) => {
            const value = digests[algo];

            return (
              <div key={algo} className="ht-digest" role="listitem">
                <span className="ht-digest__algo">{algo}</span>
                <ToolTextarea
                  id={`ht-digest-${algo}`}
                  label={`${algo} digest`}
                  full
                  code
                  readOnly
                  rows={2}
                  value={value}
                  className="ht-digest__value"
                  aria-live="polite"
                />
                <ToolActionRow className="ht-digest__actions">
                  <ToolButton
                    type="button"
                    onClick={() => void copyDigest(algo, value)}
                    disabled={!value}
                  >
                    Copy
                  </ToolButton>
                </ToolActionRow>
              </div>
            );
          })}
        </div>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}

import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolFormGrid,
  ToolHint,
  ToolInput,
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
  HMAC_ALGORITHM_DEFAULT,
  type HashAlgorithm,
  type HashEncoding,
  hmacText,
  normalizeHashAlgorithm,
  normalizeHashEncoding,
} from "@/lib/tools/hmac-generator";

import "./HmacGenerator.css";

export default function HmacGenerator() {
  const [plainText, setPlainText] = useState("");
  const [secret, setSecret] = useState("");
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>(HMAC_ALGORITHM_DEFAULT);
  const [encoding, setEncoding] = useState<HashEncoding>(HASH_ENCODING_DEFAULT);
  const [actionStatus, setActionStatus] = useState("");

  const safeAlgorithm = normalizeHashAlgorithm(algorithm);
  const safeEncoding = normalizeHashEncoding(encoding);

  const hmac = useMemo(
    () => hmacText(safeAlgorithm, plainText, secret, safeEncoding),
    [safeAlgorithm, plainText, secret, safeEncoding],
  );

  const copyHmac = useCallback(async () => {
    try {
      await copyTextToClipboard(hmac);
      setActionStatus("HMAC copied.");
    } catch {
      setActionStatus("Copy failed. Select the HMAC and copy it manually.");
    }
  }, [hmac]);

  return (
    <ToolIsland className="hmac-tool">
      <ToolPanel labelledBy="hmac-heading" className="hmac-tool__panel">
        <ToolSectionHeading
          title="HMAC generator"
          titleId="hmac-heading"
          description={
            <ToolHint>
              Enter a message and secret, pick a hashing function and encoding, then copy the HMAC.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="hmac-plain-text"
          label="Plain text to compute the hash"
          full
          rows={3}
          value={plainText}
          placeholder="Plain text to compute the hash…"
          onChange={(event) => setPlainText(event.target.value)}
          autoFocus
        />

        <ToolInput
          id="hmac-secret"
          label="Secret key"
          full
          value={secret}
          placeholder="Enter the secret key…"
          onChange={(event) => setSecret(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />

        <ToolFormGrid>
          <ToolSelect
            id="hmac-algorithm"
            label="Hashing function"
            full
            value={safeAlgorithm}
            onChange={(event) => setAlgorithm(normalizeHashAlgorithm(event.target.value))}
          >
            {HASH_ALGORITHMS.map((algo) => (
              <option key={algo} value={algo}>
                {algo}
              </option>
            ))}
          </ToolSelect>

          <ToolSelect
            id="hmac-encoding"
            label="Output encoding"
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
        </ToolFormGrid>

        <ToolTextarea
          id="hmac-output"
          label="HMAC of your text"
          full
          code
          readOnly
          rows={3}
          value={hmac}
          placeholder="The result of the HMAC…"
          className="hmac-tool__output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton type="button" onClick={() => void copyHmac()} disabled={!hmac}>
            Copy HMAC
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}

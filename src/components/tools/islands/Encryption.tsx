import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolSelect,
  ToolStatus,
  ToolTextarea,
  ToolWorkspace,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  ENCRYPTION_ALGORITHMS,
  ENCRYPTION_ALGORITHM_DEFAULT,
  ENCRYPTION_SAMPLE_CIPHERTEXT,
  ENCRYPTION_SAMPLE_PLAINTEXT,
  ENCRYPTION_SAMPLE_SECRET,
  type EncryptionAlgorithm,
  encryptText,
  normalizeEncryptionAlgorithm,
  tryDecrypt,
} from "@/lib/tools/encryption";

import "./Encryption.css";

export default function Encryption() {
  const [plainText, setPlainText] = useState(ENCRYPTION_SAMPLE_PLAINTEXT);
  const [encryptSecret, setEncryptSecret] = useState(ENCRYPTION_SAMPLE_SECRET);
  const [encryptAlgo, setEncryptAlgo] = useState<EncryptionAlgorithm>(ENCRYPTION_ALGORITHM_DEFAULT);
  const [encryptStatus, setEncryptStatus] = useState("");

  const [cipherText, setCipherText] = useState(ENCRYPTION_SAMPLE_CIPHERTEXT);
  const [decryptSecret, setDecryptSecret] = useState(ENCRYPTION_SAMPLE_SECRET);
  const [decryptAlgo, setDecryptAlgo] = useState<EncryptionAlgorithm>(ENCRYPTION_ALGORITHM_DEFAULT);
  const [decryptStatus, setDecryptStatus] = useState("");

  const safeEncryptAlgo = normalizeEncryptionAlgorithm(encryptAlgo);
  const safeDecryptAlgo = normalizeEncryptionAlgorithm(decryptAlgo);

  const encrypted = useMemo(
    () => encryptText(safeEncryptAlgo, plainText, encryptSecret),
    [safeEncryptAlgo, plainText, encryptSecret],
  );

  const decrypted = useMemo(
    () => tryDecrypt(safeDecryptAlgo, cipherText, decryptSecret),
    [safeDecryptAlgo, cipherText, decryptSecret],
  );

  const copyCiphertext = useCallback(async () => {
    try {
      await copyTextToClipboard(encrypted);
      setEncryptStatus("Ciphertext copied.");
    } catch {
      setEncryptStatus("Copy failed. Select the ciphertext and copy it manually.");
    }
  }, [encrypted]);

  const copyPlaintext = useCallback(async () => {
    if (!decrypted.ok) {
      setDecryptStatus("Decrypt successfully before copying.");
      return;
    }

    try {
      await copyTextToClipboard(decrypted.text);
      setDecryptStatus("Plaintext copied.");
    } catch {
      setDecryptStatus("Copy failed. Select the plaintext and copy it manually.");
    }
  }, [decrypted]);

  return (
    <ToolIsland className="enc-tool">
      <ToolWorkspace className="enc-tool__workspace" stagger>
        <ToolPanel labelledBy="enc-encrypt-heading" className="enc-tool__panel">
          <ToolSectionHeading
            title="Encrypt"
            titleId="enc-encrypt-heading"
            description={
              <ToolHint>
                Enter plaintext and a secret, pick an algorithm, then copy the ciphertext.
              </ToolHint>
            }
          />

          <ToolTextarea
            id="enc-plaintext"
            label="Your text"
            full
            rows={4}
            value={plainText}
            placeholder="The string to encrypt…"
            onChange={(event) => setPlainText(event.target.value)}
            autoFocus
          />

          <ToolInput
            id="enc-secret"
            label="Your secret key"
            full
            value={encryptSecret}
            placeholder="Secret key…"
            onChange={(event) => setEncryptSecret(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />

          <ToolSelect
            id="enc-encrypt-algo"
            label="Encryption algorithm"
            full
            value={safeEncryptAlgo}
            onChange={(event) => setEncryptAlgo(normalizeEncryptionAlgorithm(event.target.value))}
          >
            {ENCRYPTION_ALGORITHMS.map((algo) => (
              <option key={algo} value={algo}>
                {algo}
              </option>
            ))}
          </ToolSelect>

          <ToolTextarea
            id="enc-ciphertext-out"
            label="Your text encrypted"
            full
            code
            readOnly
            rows={3}
            value={encrypted}
            placeholder="Encrypted ciphertext…"
            className="enc-tool__output"
            aria-live="polite"
          />

          <ToolActionRow>
            <ToolButton type="button" onClick={() => void copyCiphertext()} disabled={!encrypted}>
              Copy ciphertext
            </ToolButton>
          </ToolActionRow>

          {encryptStatus ? <ToolStatus tone="success">{encryptStatus}</ToolStatus> : null}
        </ToolPanel>

        <ToolPanel labelledBy="enc-decrypt-heading" className="enc-tool__panel">
          <ToolSectionHeading
            title="Decrypt"
            titleId="enc-decrypt-heading"
            description={
              <ToolHint>
                Paste ciphertext and the matching secret and algorithm to recover the plaintext.
              </ToolHint>
            }
          />

          <ToolTextarea
            id="enc-ciphertext-in"
            label="Your encrypted text"
            full
            code
            rows={4}
            value={cipherText}
            placeholder="The string to decrypt…"
            onChange={(event) => setCipherText(event.target.value)}
            spellCheck={false}
          />

          <ToolInput
            id="enc-decrypt-secret"
            label="Your secret key"
            full
            value={decryptSecret}
            placeholder="Secret key…"
            onChange={(event) => setDecryptSecret(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />

          <ToolSelect
            id="enc-decrypt-algo"
            label="Encryption algorithm"
            full
            value={safeDecryptAlgo}
            onChange={(event) => setDecryptAlgo(normalizeEncryptionAlgorithm(event.target.value))}
          >
            {ENCRYPTION_ALGORITHMS.map((algo) => (
              <option key={algo} value={algo}>
                {algo}
              </option>
            ))}
          </ToolSelect>

          {decrypted.ok ? (
            <>
              <ToolTextarea
                id="enc-plaintext-out"
                label="Your decrypted text"
                full
                code
                readOnly
                rows={3}
                value={decrypted.text}
                placeholder="Decrypted plaintext…"
                className="enc-tool__output"
                aria-live="polite"
              />

              <ToolActionRow>
                <ToolButton
                  type="button"
                  onClick={() => void copyPlaintext()}
                  disabled={!decrypted.text}
                >
                  Copy plaintext
                </ToolButton>
              </ToolActionRow>
            </>
          ) : (
            <ToolStatus tone="error" live="polite">
              {decrypted.error}
            </ToolStatus>
          )}

          {decryptStatus ? <ToolStatus tone="success">{decryptStatus}</ToolStatus> : null}
        </ToolPanel>
      </ToolWorkspace>
    </ToolIsland>
  );
}

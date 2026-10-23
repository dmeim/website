import { useMemo, useState } from "react";

import { Input, Notice, OutputField, Panel, Select, Textarea, ToolFrame } from "@/ui/react";
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

export default function Encryption() {
  const [plainText, setPlainText] = useState(ENCRYPTION_SAMPLE_PLAINTEXT);
  const [encryptSecret, setEncryptSecret] = useState(ENCRYPTION_SAMPLE_SECRET);
  const [encryptAlgo, setEncryptAlgo] = useState<EncryptionAlgorithm>(ENCRYPTION_ALGORITHM_DEFAULT);

  const [cipherText, setCipherText] = useState(ENCRYPTION_SAMPLE_CIPHERTEXT);
  const [decryptSecret, setDecryptSecret] = useState(ENCRYPTION_SAMPLE_SECRET);
  const [decryptAlgo, setDecryptAlgo] = useState<EncryptionAlgorithm>(ENCRYPTION_ALGORITHM_DEFAULT);

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

  const algoOptions = ENCRYPTION_ALGORITHMS.map((algo) => ({ value: algo, label: algo }));

  return (
    <ToolFrame layout="split" stagger>
      <Panel
        title="Encrypt"
        titleId="enc-encrypt-heading"
        description="Enter plaintext and a secret, pick an algorithm, then copy the ciphertext."
      >
        <Textarea
          id="enc-plaintext"
          label="Your text"
          rows={4}
          value={plainText}
          placeholder="The string to encrypt…"
          onChange={(event) => setPlainText(event.target.value)}
          autoFocus
        />
        <Input
          id="enc-secret"
          label="Your secret key"
          value={encryptSecret}
          placeholder="Secret key…"
          onChange={(event) => setEncryptSecret(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <Select
          id="enc-encrypt-algo"
          label="Encryption algorithm"
          value={safeEncryptAlgo}
          onChange={(event) => setEncryptAlgo(normalizeEncryptionAlgorithm(event.target.value))}
          options={algoOptions}
        />
        <OutputField
          id="enc-ciphertext-out"
          label="Your text encrypted"
          multiline
          rows={3}
          value={encrypted}
          placeholder="Encrypted ciphertext…"
        />
      </Panel>

      <Panel
        title="Decrypt"
        titleId="enc-decrypt-heading"
        description="Paste ciphertext and the matching secret and algorithm to recover the plaintext."
      >
        <Textarea
          id="enc-ciphertext-in"
          label="Your encrypted text"
          mono
          rows={4}
          value={cipherText}
          placeholder="The string to decrypt…"
          onChange={(event) => setCipherText(event.target.value)}
          spellCheck={false}
        />
        <Input
          id="enc-decrypt-secret"
          label="Your secret key"
          value={decryptSecret}
          placeholder="Secret key…"
          onChange={(event) => setDecryptSecret(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <Select
          id="enc-decrypt-algo"
          label="Encryption algorithm"
          value={safeDecryptAlgo}
          onChange={(event) => setDecryptAlgo(normalizeEncryptionAlgorithm(event.target.value))}
          options={algoOptions}
        />
        {decrypted.ok ? (
          <OutputField
            id="enc-plaintext-out"
            label="Your decrypted text"
            multiline
            rows={3}
            value={decrypted.text}
            placeholder="Decrypted plaintext…"
          />
        ) : (
          <Notice tone="danger" live="polite">
            {decrypted.error}
          </Notice>
        )}
      </Panel>
    </ToolFrame>
  );
}

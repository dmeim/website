import { useMemo, useState } from "react";

import { FormGrid, Input, OutputField, Panel, Select, Textarea, ToolFrame } from "@/ui/react";
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

export default function HmacGenerator() {
  const [plainText, setPlainText] = useState("");
  const [secret, setSecret] = useState("");
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>(HMAC_ALGORITHM_DEFAULT);
  const [encoding, setEncoding] = useState<HashEncoding>(HASH_ENCODING_DEFAULT);

  const safeAlgorithm = normalizeHashAlgorithm(algorithm);
  const safeEncoding = normalizeHashEncoding(encoding);

  const hmac = useMemo(
    () => hmacText(safeAlgorithm, plainText, secret, safeEncoding),
    [safeAlgorithm, plainText, secret, safeEncoding],
  );

  return (
    <ToolFrame>
      <Panel
        title="HMAC generator"
        titleId="hmac-heading"
        description="Enter a message and secret, pick a hashing function and encoding, then copy the HMAC."
      >
        <Textarea
          id="hmac-plain-text"
          label="Plain text to compute the hash"
          rows={3}
          value={plainText}
          placeholder="Plain text to compute the hash…"
          onChange={(event) => setPlainText(event.target.value)}
          autoFocus
        />
        <Input
          id="hmac-secret"
          label="Secret key"
          value={secret}
          placeholder="Enter the secret key…"
          onChange={(event) => setSecret(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <FormGrid columns={2}>
          <Select
            id="hmac-algorithm"
            label="Hashing function"
            value={safeAlgorithm}
            onChange={(event) => setAlgorithm(normalizeHashAlgorithm(event.target.value))}
            options={HASH_ALGORITHMS.map((algo) => ({ value: algo, label: algo }))}
          />
          <Select
            id="hmac-encoding"
            label="Output encoding"
            value={safeEncoding}
            onChange={(event) => setEncoding(normalizeHashEncoding(event.target.value))}
            options={HASH_ENCODING_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          />
        </FormGrid>
        <OutputField
          id="hmac-output"
          label="HMAC of your text"
          multiline
          rows={3}
          value={hmac}
          placeholder="The result of the HMAC…"
        />
      </Panel>
    </ToolFrame>
  );
}

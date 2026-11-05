import { useCallback, useEffect, useRef, useState } from "react";

import { Button, CopyButton, Input, Notice, OutputField, Panel, Progress, ToolFrame } from "@/ui/react";
import {
  RSA_BITS_AUTO_REGEN_MAX,
  RSA_BITS_DEFAULT,
  RSA_BITS_MAX,
  RSA_BITS_MIN,
  generateRsaKeyPair,
  isValidRsaBits,
  normalizeRsaBits,
} from "@/lib/tools/rsa-key-pair-generator";

const BITS_DEBOUNCE_MS = 300;
const EMPTY_PAIR = { publicKeyPem: "", privateKeyPem: "" };

type GenerateRequest = {
  bits: number;
  /** Bumps to re-run even when bits are unchanged (Refresh). */
  nonce: number;
  immediate: boolean;
};

function bitsErrorMessage(bits: number): string | null {
  if (isValidRsaBits(bits)) {
    return null;
  }

  return `Bits should be ${RSA_BITS_MIN} ≤ bits ≤ ${RSA_BITS_MAX} and a multiple of 8.`;
}

export default function RsaKeyPairGenerator() {
  const [bitsInput, setBitsInput] = useState(RSA_BITS_DEFAULT);
  const [request, setRequest] = useState<GenerateRequest>({
    bits: RSA_BITS_DEFAULT,
    nonce: 0,
    immediate: true,
  });
  const [publicKeyPem, setPublicKeyPem] = useState("");
  const [privateKeyPem, setPrivateKeyPem] = useState("");
  const [pending, setPending] = useState(true);
  const [actionStatus, setActionStatus] = useState("");
  const [errorStatus, setErrorStatus] = useState("");

  const runIdRef = useRef(0);

  const bitsValid = isValidRsaBits(bitsInput);
  const bitsError = bitsErrorMessage(bitsInput);
  const slowHint =
    bitsValid && bitsInput >= 4096
      ? bitsInput >= 8192
        ? "≥8192-bit keys can take a long time in the browser, and generation may appear frozen."
        : "≥4096-bit keys are slower; wait for generation to finish before refreshing again."
      : null;

  useEffect(() => {
    if (!isValidRsaBits(request.bits)) {
      setPending(false);
      return;
    }

    let cancelled = false;
    const delay = request.immediate ? 0 : BITS_DEBOUNCE_MS;

    setPending(true);
    setErrorStatus("");

    const timer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      const runId = ++runIdRef.current;
      setPending(true);
      setErrorStatus("");

      void (async () => {
        try {
          const pair = await generateRsaKeyPair({ bits: request.bits });
          if (runId !== runIdRef.current) {
            return;
          }

          setPublicKeyPem(pair.publicKeyPem);
          setPrivateKeyPem(pair.privateKeyPem);
          setActionStatus(`${request.bits}-bit key pair ready.`);
        } catch (error) {
          if (runId !== runIdRef.current) {
            return;
          }

          setPublicKeyPem(EMPTY_PAIR.publicKeyPem);
          setPrivateKeyPem(EMPTY_PAIR.privateKeyPem);
          console.error("RSA key generation failed", { bits: request.bits, error });
          setErrorStatus(`Your browser could not generate a ${request.bits}-bit key. Try a size between 2048 and 4096 bits.`);
          setActionStatus("");
        } finally {
          if (runId === runIdRef.current) {
            setPending(false);
          }
        }
      })();
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      runIdRef.current += 1;
    };
  }, [request]);

  const onBitsChange = useCallback((raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      setBitsInput(Number.NaN);
      return;
    }

    setBitsInput(parsed);

    if (!isValidRsaBits(parsed)) {
      return;
    }

    if (parsed > RSA_BITS_AUTO_REGEN_MAX) {
      return;
    }

    setRequest((prev) => ({
      bits: parsed,
      nonce: prev.nonce + 1,
      immediate: false,
    }));
  }, []);

  const refreshKeys = useCallback(() => {
    if (!isValidRsaBits(bitsInput)) {
      setErrorStatus(bitsErrorMessage(bitsInput) ?? "Enter a valid bit size.");
      return;
    }

    setRequest((prev) => ({
      bits: bitsInput,
      nonce: prev.nonce + 1,
      immediate: true,
    }));
  }, [bitsInput]);

  const showKeys = !pending && !bitsError;
  const bitsFieldValue = Number.isFinite(bitsInput) ? bitsInput : "";

  return (
    <ToolFrame>
      <Panel
        title="RSA key pair"
        titleId="rsa-heading"
        description="Choose a modulus length and generate a fresh RSA-OAEP key pair as PEM. Keys ≥4096 bits (especially ≥8192) are slow in the browser, so use Refresh for those sizes."
        actions={
          <Button
            variant="primary"
            iconStart="arrows-clockwise"
            onClick={refreshKeys}
            disabled={pending || !bitsValid}
            data-testid="refresh"
          >
            {pending ? "Generating…" : "Refresh key pair"}
          </Button>
        }
      >
        <Input
          id="rsa-bits"
          label="Bits"
          type="number"
          min={RSA_BITS_MIN}
          max={RSA_BITS_MAX}
          step={8}
          value={bitsFieldValue}
          onChange={(event) => onBitsChange(event.target.value)}
          error={bitsError ?? undefined}
        />

        {slowHint && !bitsError ? (
          <Notice tone="warning" live="polite">
            {slowHint}
          </Notice>
        ) : null}

        {bitsValid && bitsInput > RSA_BITS_AUTO_REGEN_MAX && !pending ? (
          <Notice tone="info">
            Auto-refresh is off above {RSA_BITS_AUTO_REGEN_MAX} bits. Press Refresh key pair to generate (
            {normalizeRsaBits(bitsInput)}-bit).
          </Notice>
        ) : null}

        {pending ? (
          <Progress
            indeterminate
            size="sm"
            label={`Generating ${isValidRsaBits(request.bits) ? `${request.bits}-bit` : ""} key pair…`}
          />
        ) : null}

        {errorStatus ? (
          <Notice tone="danger" live="assertive">
            {errorStatus}
          </Notice>
        ) : null}

        {!pending && !bitsError && actionStatus ? (
          <Notice tone="success" live="polite">
            {actionStatus}
          </Notice>
        ) : null}

        <div aria-busy={pending || undefined}>
          <OutputField
            id="rsa-public-key"
            label="Public key"
            multiline
            rows={8}
            copy={false}
            value={showKeys ? publicKeyPem : ""}
            placeholder={pending ? "Generating public key…" : "Public key PEM"}
          />
        </div>
        <div>
          <CopyButton value={publicKeyPem} label="Copy public key" disabled={!showKeys || !publicKeyPem} />
        </div>

        <div aria-busy={pending || undefined}>
          <OutputField
            id="rsa-private-key"
            label="Private key"
            multiline
            rows={12}
            copy={false}
            value={showKeys ? privateKeyPem : ""}
            placeholder={pending ? "Generating private key…" : "Private key PEM"}
          />
        </div>
        <div>
          <CopyButton value={privateKeyPem} label="Copy private key" disabled={!showKeys || !privateKeyPem} />
        </div>
      </Panel>
    </ToolFrame>
  );
}

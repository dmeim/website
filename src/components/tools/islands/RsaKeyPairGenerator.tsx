import { useCallback, useEffect, useRef, useState } from "react";

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
import {
  RSA_BITS_AUTO_REGEN_MAX,
  RSA_BITS_DEFAULT,
  RSA_BITS_MAX,
  RSA_BITS_MIN,
  generateRsaKeyPair,
  isValidRsaBits,
  normalizeRsaBits,
} from "@/lib/tools/rsa-key-pair-generator";

import "./RsaKeyPairGenerator.css";

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
        ? "≥8192-bit keys can take a long time in the browser — generation may appear frozen."
        : "≥4096-bit keys are slower; wait for generation to finish before refreshing again."
      : null;

  useEffect(() => {
    if (!isValidRsaBits(request.bits)) {
      setPending(false);
      return;
    }

    let cancelled = false;
    const delay = request.immediate ? 0 : BITS_DEBOUNCE_MS;

    if (request.immediate) {
      setPending(true);
      setErrorStatus("");
    }

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
          setErrorStatus(
            error instanceof Error
              ? error.message
              : "Key generation failed. Try a smaller bit size.",
          );
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

  const copyPublic = useCallback(async () => {
    if (!publicKeyPem) {
      setActionStatus("Generate a key pair before copying.");
      return;
    }

    try {
      await copyTextToClipboard(publicKeyPem);
      setActionStatus("Public key copied.");
    } catch {
      setActionStatus("Copy failed. Select the public key and copy it manually.");
    }
  }, [publicKeyPem]);

  const copyPrivate = useCallback(async () => {
    if (!privateKeyPem) {
      setActionStatus("Generate a key pair before copying.");
      return;
    }

    try {
      await copyTextToClipboard(privateKeyPem);
      setActionStatus("Private key copied.");
    } catch {
      setActionStatus("Copy failed. Select the private key and copy it manually.");
    }
  }, [privateKeyPem]);

  const bitsFieldValue = Number.isFinite(bitsInput) ? bitsInput : "";

  return (
    <ToolIsland className="rsa-tool">
      <ToolPanel labelledBy="rsa-heading" className="rsa-tool__panel">
        <ToolSectionHeading
          title="RSA key pair"
          titleId="rsa-heading"
          description={
            <ToolHint>
              Choose a modulus length and generate a fresh RSA-OAEP key pair as PEM. Keys ≥4096
              bits (especially ≥8192) are slow in the browser — use Refresh for those sizes.
            </ToolHint>
          }
        />

        <ToolInput
          id="rsa-bits"
          label="Bits"
          full
          type="number"
          min={RSA_BITS_MIN}
          max={RSA_BITS_MAX}
          step={8}
          value={bitsFieldValue}
          onChange={(event) => onBitsChange(event.target.value)}
          aria-invalid={bitsError ? true : undefined}
        />

        {bitsError ? (
          <ToolStatus tone="error" live="polite">
            {bitsError}
          </ToolStatus>
        ) : null}

        {slowHint && !bitsError ? (
          <ToolStatus tone="default" live="polite">
            {slowHint}
          </ToolStatus>
        ) : null}

        {bitsValid && bitsInput > RSA_BITS_AUTO_REGEN_MAX && !pending ? (
          <ToolHint>
            Auto-refresh is off above {RSA_BITS_AUTO_REGEN_MAX} bits — press Refresh key-pair to
            generate ({normalizeRsaBits(bitsInput)}-bit).
          </ToolHint>
        ) : null}

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={refreshKeys}
            disabled={pending || !bitsValid}
            data-testid="refresh"
          >
            {pending ? "Generating…" : "Refresh key-pair"}
          </ToolButton>
        </ToolActionRow>

        <ToolTextarea
          id="rsa-public-key"
          label="Public key"
          full
          code
          readOnly
          rows={8}
          value={publicKeyPem}
          placeholder={pending ? "Generating public key…" : "Public key PEM"}
          className="rsa-tool__pem"
          aria-busy={pending || undefined}
        />

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyPublic()}
            disabled={pending || !publicKeyPem}
          >
            Copy public key
          </ToolButton>
        </ToolActionRow>

        <ToolTextarea
          id="rsa-private-key"
          label="Private key"
          full
          code
          readOnly
          rows={12}
          value={privateKeyPem}
          placeholder={pending ? "Generating private key…" : "Private key PEM"}
          className="rsa-tool__pem"
          aria-busy={pending || undefined}
        />

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyPrivate()}
            disabled={pending || !privateKeyPem}
          >
            Copy private key
          </ToolButton>
        </ToolActionRow>

        {pending ? (
          <ToolStatus tone="default" live="polite">
            Generating {isValidRsaBits(request.bits) ? `${request.bits}-bit` : ""} key pair…
          </ToolStatus>
        ) : null}

        {errorStatus ? (
          <ToolStatus tone="error" live="assertive">
            {errorStatus}
          </ToolStatus>
        ) : null}

        {!pending && actionStatus ? (
          <ToolStatus tone="success" live="polite">
            {actionStatus}
          </ToolStatus>
        ) : null}
      </ToolPanel>
    </ToolIsland>
  );
}

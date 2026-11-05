import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Button,
  ButtonGroup,
  CopyButton,
  Figure,
  FormGrid,
  IconButton,
  Input,
  KeyValue,
  Notice,
  OutputField,
  Panel,
  Progress,
  Stack,
  Stat,
  ToolFrame,
} from "@/ui/react";
import {
  OTP_TIME_STEP_DEFAULT,
  base32toHex,
  buildKeyUri,
  generateSecret,
  generateTokenWindow,
  getCounterFromTime,
  isValidBase32Secret,
  normalizeBase32Secret,
} from "@/lib/tools/otp-generator";
import { renderQrPngDataUrl } from "@/lib/tools/qr-code/qrCode.service";

import "./OtpGenerator.css";

export default function OtpGenerator() {
  const [secret, setSecret] = useState(() => generateSecret());
  const [now, setNow] = useState(() => Date.now());
  const [qr, setQr] = useState({ url: "", failed: false });

  const secretValid = isValidBase32Secret(secret);
  const normalizedSecret = useMemo(() => normalizeBase32Secret(secret), [secret]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const tokens = useMemo(() => {
    if (!secretValid) {
      return { previous: "–––", current: "–––", next: "–––" };
    }
    return generateTokenWindow({ key: normalizedSecret, now });
  }, [normalizedSecret, secretValid, now]);

  const keyUri = useMemo(
    () => (secretValid ? buildKeyUri({ secret: normalizedSecret }) : ""),
    [normalizedSecret, secretValid],
  );

  const secretHex = useMemo(
    () => (secretValid ? base32toHex(normalizedSecret) : ""),
    [normalizedSecret, secretValid],
  );

  const epochSeconds = Math.floor(now / 1000);
  const counter = getCounterFromTime({
    now,
    timeStep: OTP_TIME_STEP_DEFAULT,
  });
  const counterHex = counter.toString(16).padStart(16, "0");
  const interval = (now / 1000) % OTP_TIME_STEP_DEFAULT;
  const secondsLeft = Math.max(0, Math.floor(OTP_TIME_STEP_DEFAULT - interval));

  useEffect(() => {
    let cancelled = false;

    if (!keyUri) {
      setQr({ url: "", failed: false });
      return;
    }

    void renderQrPngDataUrl({
      text: keyUri,
      foregroundColor: "#000000",
      backgroundColor: "#ffffff",
      errorCorrectionLevel: "M",
      size: 210,
      margin: 1,
    }).then(
      (url: string) => {
        if (!cancelled) setQr({ url, failed: false });
      },
      () => {
        // The key URI can outgrow what a QR code holds when the secret is very long.
        if (!cancelled) setQr({ url: "", failed: true });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [keyUri]);

  const refreshSecret = useCallback(() => {
    setSecret(generateSecret());
  }, []);

  const copyable = (value: string) => (value && value !== "–––" ? value : false);

  return (
    <ToolFrame layout="split" stagger>
      <Panel
        title="TOTP codes"
        titleId="otp-codes-heading"
        description="Paste or generate a Base32 secret to live-update previous, current, and next codes (SHA1 · 6 digits · 30s)."
      >
        <Input
          id="otp-secret"
          label="Secret"
          mono
          autoComplete="off"
          spellCheck={false}
          value={secret}
          placeholder="Paste your TOTP secret…"
          onChange={(event) => setSecret(event.target.value)}
          error={normalizedSecret.length > 0 && !secretValid ? "The secret should be a Base32 string, using only the letters A to Z and the digits 2 to 7." : undefined}
          trailing={
            <IconButton icon="arrows-clockwise" label="Generate a new random secret" size="sm" onClick={refreshSecret} />
          }
        />

        <Stack role="group" aria-label="OTP codes" gap="sm">
          <Stat label="Current OTP" value={tokens.current} size="xl" mono live />
          <ButtonGroup>
            <CopyButton value={tokens.current} label="Copy current OTP" disabled={!copyable(tokens.current)} />
          </ButtonGroup>
          <KeyValue
            items={[
              { label: "Previous", value: tokens.previous, mono: true, copy: copyable(tokens.previous) },
              { label: "Next", value: tokens.next, mono: true, copy: copyable(tokens.next) },
            ]}
          />
        </Stack>

        <Progress
          value={secretValid ? interval : 0}
          max={OTP_TIME_STEP_DEFAULT}
          size="sm"
          label={`Next in ${String(secondsLeft).padStart(2, "0")}s`}
        />

        {qr.url ? (
          <Figure className="otp-qr" src={qr.url} alt="QR code for otpauth key URI" frame priority />
        ) : (
          <Notice tone="neutral">
            {qr.failed
              ? "This secret is too long to fit in a QR code. You can still copy the key URI."
              : "A QR code appears here once you enter a valid secret."}
          </Notice>
        )}

        <ButtonGroup>
          {keyUri ? (
            <Button variant="primary" href={keyUri} target="_blank" rel="noreferrer" iconEnd="arrow-square-out">
              Open key URI
            </Button>
          ) : (
            <Button variant="primary" disabled>
              Open key URI
            </Button>
          )}
          <CopyButton value={keyUri} label="Copy key URI" variant="ghost" disabled={!keyUri} />
        </ButtonGroup>
      </Panel>

      <Panel
        title="Secret details"
        titleId="otp-details-heading"
        description="Hex encoding of the secret plus the current Unix epoch and HOTP counter used for TOTP."
      >
        <OutputField
          id="otp-secret-hex"
          label="Secret in hexadecimal"
          value={secretHex}
          placeholder="Secret in hex will appear here"
        />
        <FormGrid columns={2}>
          <OutputField id="otp-epoch" label="Epoch (seconds)" value={String(epochSeconds)} />
          <OutputField id="otp-counter" label="Iteration count" value={String(counter)} />
        </FormGrid>
        <OutputField id="otp-counter-hex" label="Padded hex counter" value={counterHex} />
      </Panel>
    </ToolFrame>
  );
}

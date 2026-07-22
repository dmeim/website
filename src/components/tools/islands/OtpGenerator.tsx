import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolFormGrid,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolWorkspace,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  OTP_TIME_STEP_DEFAULT,
  base32toHex,
  buildKeyUri,
  generateSecret,
  generateTokenWindow,
  getCounterFromTime,
  isValidBase32Secret,
} from "@/lib/tools/otp-generator";
import { renderQrPngDataUrl } from "@/lib/tools/qr-code/qrCode.service";

import "./OtpGenerator.css";

export default function OtpGenerator() {
  const [secret, setSecret] = useState(() => generateSecret());
  const [now, setNow] = useState(() => Date.now());
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const secretValid = isValidBase32Secret(secret);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const tokens = useMemo(() => {
    if (!secretValid) {
      return { previous: "———", current: "———", next: "———" };
    }
    return generateTokenWindow({ key: secret, now });
  }, [secret, secretValid, now]);

  const keyUri = useMemo(
    () => (secretValid ? buildKeyUri({ secret }) : ""),
    [secret, secretValid],
  );

  const secretHex = useMemo(
    () => (secretValid ? base32toHex(secret) : ""),
    [secret, secretValid],
  );

  const epochSeconds = Math.floor(now / 1000);
  const counter = getCounterFromTime({
    now,
    timeStep: OTP_TIME_STEP_DEFAULT,
  });
  const counterHex = counter.toString(16).padStart(16, "0");
  const interval = (now / 1000) % OTP_TIME_STEP_DEFAULT;
  const secondsLeft = Math.max(0, Math.floor(OTP_TIME_STEP_DEFAULT - interval));
  const progressPct = (100 * interval) / OTP_TIME_STEP_DEFAULT;

  useEffect(() => {
    let cancelled = false;

    if (!keyUri) {
      setQrDataUrl("");
      return;
    }

    void renderQrPngDataUrl({
      text: keyUri,
      foregroundColor: "#000000",
      backgroundColor: "#ffffff",
      errorCorrectionLevel: "M",
      size: 210,
      margin: 1,
    }).then((url: string) => {
      if (!cancelled) setQrDataUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [keyUri]);

  const refreshSecret = useCallback(() => {
    setSecret(generateSecret());
    setActionStatus("New secret generated.");
  }, []);

  const copyValue = useCallback(async (value: string, label: string) => {
    if (!value || value === "———") {
      setActionStatus("Nothing to copy yet — enter a valid Base32 secret.");
      return;
    }
    try {
      await copyTextToClipboard(value);
      setActionStatus(`${label} copied.`);
    } catch {
      setActionStatus("Copy failed. Select the value and copy it manually.");
    }
  }, []);

  return (
    <ToolIsland className="otp-tool">
      <ToolWorkspace stagger className="otp-tool__workspace">
        <ToolPanel labelledBy="otp-codes-heading" className="otp-tool__panel">
          <ToolSectionHeading
            title="TOTP codes"
            titleId="otp-codes-heading"
            description={
              <ToolHint>
                Paste or generate a Base32 secret to live-update previous, current, and next
                codes (SHA1 · 6 digits · 30s).
              </ToolHint>
            }
          />

          <div className="otp-secret-row">
            <ToolInput
              id="otp-secret"
              label="Secret"
              full
              autoComplete="off"
              spellCheck={false}
              value={secret}
              placeholder="Paste your TOTP secret…"
              onChange={(event) => setSecret(event.target.value.trim())}
              aria-invalid={secret.length > 0 && !secretValid}
            />
            <ToolButton
              type="button"
              variant="ghost"
              className="otp-refresh"
              onClick={refreshSecret}
              aria-label="Generate a new random secret"
            >
              Refresh
            </ToolButton>
          </div>

          {secret.length > 0 && !secretValid ? (
            <ToolStatus tone="error">Secret should be a Base32 string (A–Z, 2–7).</ToolStatus>
          ) : null}

          <div className="otp-tokens" role="group" aria-label="OTP codes">
            <div className="otp-tokens__labels">
              <span>Previous</span>
              <span>Current OTP</span>
              <span>Next</span>
            </div>
            <div className="otp-tokens__row">
              <button
                type="button"
                className="otp-token otp-token--side"
                onClick={() => void copyValue(tokens.previous, "Previous OTP")}
              >
                {tokens.previous}
              </button>
              <button
                type="button"
                className="otp-token otp-token--current"
                onClick={() => void copyValue(tokens.current, "Current OTP")}
              >
                {tokens.current}
              </button>
              <button
                type="button"
                className="otp-token otp-token--side"
                onClick={() => void copyValue(tokens.next, "Next OTP")}
              >
                {tokens.next}
              </button>
            </div>
          </div>

          <div className="otp-progress" aria-hidden={!secretValid}>
            <div className="otp-progress__track">
              <div
                className="otp-progress__fill"
                style={{ width: `${secretValid ? progressPct : 0}%` }}
              />
            </div>
            <p className="otp-progress__label">
              Next in {String(secondsLeft).padStart(2, "0")}s
            </p>
          </div>

          <div className="otp-qr">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR code for otpauth key URI"
                width={210}
                height={210}
                className="otp-qr__image"
              />
            ) : (
              <div className="otp-qr__placeholder" aria-hidden>
                QR appears for a valid secret
              </div>
            )}
            <ToolActionRow>
              {keyUri ? (
                <a className="btn btn--primary" href={keyUri} target="_blank" rel="noreferrer">
                  Open key URI
                </a>
              ) : (
                <ToolButton type="button" variant="primary" disabled>
                  Open key URI
                </ToolButton>
              )}
              <ToolButton
                type="button"
                variant="ghost"
                disabled={!keyUri}
                onClick={() => void copyValue(keyUri, "Key URI")}
              >
                Copy key URI
              </ToolButton>
            </ToolActionRow>
          </div>
        </ToolPanel>

        <ToolPanel labelledBy="otp-details-heading" className="otp-tool__panel">
          <ToolSectionHeading
            title="Secret details"
            titleId="otp-details-heading"
            description={
              <ToolHint>
                Hex encoding of the secret plus the current Unix epoch and HOTP counter used for
                TOTP.
              </ToolHint>
            }
          />

          <ToolFormGrid>
            <ToolInput
              id="otp-secret-hex"
              label="Secret in hexadecimal"
              full
              readOnly
              className="tool-code"
              value={secretHex}
              placeholder="Secret in hex will appear here"
            />
            <ToolInput
              id="otp-epoch"
              label="Epoch (seconds)"
              full
              readOnly
              className="tool-code"
              value={String(epochSeconds)}
            />
            <ToolInput
              id="otp-counter"
              label="Iteration count"
              full
              readOnly
              className="tool-code"
              value={String(counter)}
            />
            <ToolInput
              id="otp-counter-hex"
              label="Padded hex counter"
              full
              readOnly
              className="tool-code"
              value={counterHex}
            />
          </ToolFormGrid>

          <ToolActionRow>
            <ToolButton
              type="button"
              disabled={!secretHex}
              onClick={() => void copyValue(secretHex, "Hex secret")}
            >
              Copy hex secret
            </ToolButton>
            <ToolButton
              type="button"
              variant="ghost"
              onClick={() => void copyValue(String(counter), "Iteration count")}
            >
              Copy counter
            </ToolButton>
          </ToolActionRow>
        </ToolPanel>
      </ToolWorkspace>

      {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
    </ToolIsland>
  );
}

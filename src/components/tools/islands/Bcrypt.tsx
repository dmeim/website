import { useCallback, useEffect, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolField,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolTextarea,
  ToolWorkspace,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  BCRYPT_ROUNDS_DEFAULT,
  BCRYPT_ROUNDS_MAX,
  BCRYPT_ROUNDS_MIN,
  clampSaltRounds,
  comparePassword,
  hashPassword,
  isBcryptHash,
  passwordTruncates,
} from "@/lib/tools/bcrypt";

import "./Bcrypt.css";

const HASH_DEBOUNCE_MS = 280;
const COMPARE_DEBOUNCE_MS = 280;

type CompareState = "idle" | "pending" | "yes" | "no" | "invalid";

export default function Bcrypt() {
  const [clearText, setClearText] = useState("");
  const [rounds, setRounds] = useState(BCRYPT_ROUNDS_DEFAULT);
  const [hashed, setHashed] = useState("");
  const [hashPending, setHashPending] = useState(false);
  const [actionStatus, setActionStatus] = useState("");

  const [compareString, setCompareString] = useState("");
  const [compareHash, setCompareHash] = useState("");
  const [compareState, setCompareState] = useState<CompareState>("idle");

  const safeRounds = clampSaltRounds(rounds);
  const roundsFillPercent =
    ((safeRounds - BCRYPT_ROUNDS_MIN) / (BCRYPT_ROUNDS_MAX - BCRYPT_ROUNDS_MIN)) * 100;
  const truncates = passwordTruncates(clearText);

  useEffect(() => {
    let cancelled = false;
    setHashPending(true);

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const next = await hashPassword(clearText, safeRounds);
          if (!cancelled) {
            setHashed(next);
          }
        } catch {
          if (!cancelled) {
            setHashed("");
            setActionStatus("Hashing failed. Try a lower salt-round count.");
          }
        } finally {
          if (!cancelled) {
            setHashPending(false);
          }
        }
      })();
    }, HASH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [clearText, safeRounds]);

  useEffect(() => {
    const trimmedHash = compareHash.trim();

    if (!compareString && !trimmedHash) {
      setCompareState("idle");
      return;
    }

    if (!trimmedHash) {
      setCompareState("idle");
      return;
    }

    if (!isBcryptHash(trimmedHash)) {
      setCompareState("invalid");
      return;
    }

    let cancelled = false;
    setCompareState("pending");

    const timer = window.setTimeout(() => {
      void (async () => {
        const matches = await comparePassword(compareString, trimmedHash);
        if (!cancelled) {
          setCompareState(matches ? "yes" : "no");
        }
      })();
    }, COMPARE_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [compareString, compareHash]);

  const copyHash = useCallback(async () => {
    if (!hashed) {
      setActionStatus("Wait for a hash to finish before copying.");
      return;
    }

    try {
      await copyTextToClipboard(hashed);
      setActionStatus("Hash copied.");
    } catch {
      setActionStatus("Copy failed. Select the hash and copy it manually.");
    }
  }, [hashed]);

  const compareLabel =
    compareState === "yes"
      ? "Yes"
      : compareState === "no"
        ? "No"
        : compareState === "invalid"
          ? "Invalid hash"
          : compareState === "pending"
            ? "Checking…"
            : "—";

  const compareTone =
    compareState === "yes" ? "success" : compareState === "no" || compareState === "invalid" ? "error" : "default";

  return (
    <ToolIsland className="bc-tool">
      <ToolWorkspace className="bc-tool__workspace" stagger>
        <ToolPanel labelledBy="bc-hash-heading" className="bc-tool__panel">
          <ToolSectionHeading
            title="Hash"
            titleId="bc-hash-heading"
            description={
              <ToolHint>
                Enter text and salt rounds. The bcrypt hash updates as you type (async, debounced).
              </ToolHint>
            }
          />

          <ToolInput
            id="bc-clear-text"
            label="Your string"
            full
            value={clearText}
            placeholder="Your string to bcrypt…"
            onChange={(event) => setClearText(event.target.value)}
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />

          {truncates ? (
            <ToolStatus tone="accent">
              This string is longer than 72 bytes; bcrypt will truncate it before hashing.
            </ToolStatus>
          ) : null}

          <ToolField label={`Salt rounds (${safeRounds})`} htmlFor="bc-rounds" full>
            <div className="bc-range-slider">
              <div className="bc-range-track" />
              <div className="bc-range-fill" style={{ width: `${roundsFillPercent}%` }} />
              <input
                id="bc-rounds"
                type="range"
                min={BCRYPT_ROUNDS_MIN}
                max={BCRYPT_ROUNDS_MAX}
                step={1}
                value={safeRounds}
                onChange={(event) => setRounds(Number(event.target.value))}
                aria-valuemin={BCRYPT_ROUNDS_MIN}
                aria-valuemax={BCRYPT_ROUNDS_MAX}
                aria-valuenow={safeRounds}
              />
            </div>
            <div className="bc-range-labels" aria-hidden="true">
              <span>{BCRYPT_ROUNDS_MIN}</span>
              <span>{BCRYPT_ROUNDS_MAX}</span>
            </div>
          </ToolField>

          {safeRounds >= 14 ? (
            <ToolHint>
              High salt rounds can take a long time in the browser. Prefer 8–12 for interactive use.
            </ToolHint>
          ) : null}

          <ToolTextarea
            id="bc-hash-output"
            label="Hash"
            full
            code
            readOnly
            rows={3}
            value={hashed}
            placeholder={hashPending ? "Hashing…" : "Hash appears here"}
            className="bc-hash-display"
            aria-live="polite"
          />

          <ToolActionRow>
            <ToolButton type="button" onClick={() => void copyHash()} disabled={!hashed || hashPending}>
              Copy hash
            </ToolButton>
          </ToolActionRow>

          {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
        </ToolPanel>

        <ToolPanel labelledBy="bc-compare-heading" className="bc-tool__panel">
          <ToolSectionHeading
            title="Compare string with hash"
            titleId="bc-compare-heading"
            description={<ToolHint>Check whether a cleartext string matches a bcrypt hash.</ToolHint>}
          />

          <ToolInput
            id="bc-compare-string"
            label="Your string"
            full
            value={compareString}
            placeholder="Your string to compare…"
            onChange={(event) => setCompareString(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />

          <ToolTextarea
            id="bc-compare-hash"
            label="Your hash"
            full
            code
            rows={3}
            value={compareHash}
            placeholder="Your hash to compare…"
            onChange={(event) => setCompareHash(event.target.value)}
            spellCheck={false}
          />

          <div className="bc-compare-row">
            <span className="bc-compare-label">Do they match?</span>
            <ToolStatus tone={compareTone} className="bc-compare-result" live="polite">
              {compareLabel}
            </ToolStatus>
          </div>
        </ToolPanel>
      </ToolWorkspace>
    </ToolIsland>
  );
}

import { useEffect, useState } from "react";

import { CopyButton, Input, KeyValue, Notice, OutputField, Panel, Progress, Slider, Textarea, ToolFrame } from "@/ui/react";
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
  const truncates = passwordTruncates(clearText);

  useEffect(() => {
    let cancelled = false;
    setHashPending(true);
    setActionStatus("");

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

  const compareLabel =
    compareState === "yes"
      ? "Yes"
      : compareState === "no"
        ? "No"
        : compareState === "invalid"
          ? "Invalid hash"
          : compareState === "pending"
            ? "Checking…"
            : "–";

  const compareTone =
    compareState === "yes" ? "success" : compareState === "no" || compareState === "invalid" ? "danger" : "default";

  return (
    <ToolFrame layout="split" stagger>
      <Panel
        title="Hash"
        titleId="bc-hash-heading"
        description="Enter text and salt rounds. The bcrypt hash updates as you type (async, debounced)."
      >
        <Input
          id="bc-clear-text"
          label="Your string"
          value={clearText}
          placeholder="Your string to bcrypt…"
          onChange={(event) => setClearText(event.target.value)}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />

        {truncates ? (
          <Notice tone="accent">This string is longer than 72 bytes; bcrypt will truncate it before hashing.</Notice>
        ) : null}

        <Slider
          id="bc-rounds"
          label="Salt rounds"
          min={BCRYPT_ROUNDS_MIN}
          max={BCRYPT_ROUNDS_MAX}
          step={1}
          value={safeRounds}
          onChange={(value) => setRounds(Number(value))}
          showValue
        />

        {safeRounds >= 14 ? (
          <Notice tone="warning">
            {safeRounds >= 20
              ? "Each extra round doubles the work, so this can take hours or longer, and it keeps running until you reload the page."
              : "High salt rounds can take a long time in the browser. Prefer 8–12 for interactive use."}
          </Notice>
        ) : null}

        <OutputField
          id="bc-hash-output"
          label="Hash"
          multiline
          rows={3}
          copy={false}
          value={hashPending ? "" : hashed}
          placeholder={hashPending ? "Hashing…" : "Hash appears here"}
        />

        {hashPending ? <Progress indeterminate label="Hashing" labelHidden size="sm" /> : null}

        <div>
          <CopyButton value={hashed} label="Copy hash" variant="primary" disabled={!hashed || hashPending} />
        </div>

        {actionStatus ? <Notice tone="danger">{actionStatus}</Notice> : null}
      </Panel>

      <Panel
        title="Compare string with hash"
        titleId="bc-compare-heading"
        description="Check whether a cleartext string matches a bcrypt hash."
      >
        <Input
          id="bc-compare-string"
          label="Your string"
          value={compareString}
          placeholder="Your string to compare…"
          onChange={(event) => setCompareString(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />

        <Textarea
          id="bc-compare-hash"
          label="Your hash"
          mono
          rows={3}
          value={compareHash}
          placeholder="Your hash to compare…"
          onChange={(event) => setCompareHash(event.target.value)}
          spellCheck={false}
        />

        <div aria-live="polite">
          <KeyValue items={[{ label: "Do they match?", value: compareLabel, tone: compareTone }]} />
        </div>
      </Panel>
    </ToolFrame>
  );
}

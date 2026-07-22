import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolCheck,
  ToolFormGrid,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolTextarea,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import { obfuscateString } from "@/lib/tools/string-obfuscator";

import "./StringObfuscator.css";

function parseNonNegativeInt(raw: string, fallback: number): number {
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

export default function StringObfuscator() {
  const [text, setText] = useState("Lorem ipsum dolor sit amet");
  const [keepFirstRaw, setKeepFirstRaw] = useState("4");
  const [keepLastRaw, setKeepLastRaw] = useState("4");
  const [keepSpace, setKeepSpace] = useState(true);
  const [actionStatus, setActionStatus] = useState("");

  const keepFirst = parseNonNegativeInt(keepFirstRaw, 4);
  const keepLast = parseNonNegativeInt(keepLastRaw, 4);

  const obfuscated = useMemo(
    () =>
      obfuscateString(text, {
        keepFirst,
        keepLast,
        keepSpace,
      }),
    [text, keepFirst, keepLast, keepSpace],
  );

  const copyObfuscated = useCallback(async () => {
    if (!obfuscated) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(obfuscated);
      setActionStatus("Obfuscated string copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [obfuscated]);

  return (
    <ToolIsland className="string-obfuscator-tool">
      <ToolPanel
        labelledBy="string-obfuscator-heading"
        className="string-obfuscator-tool__panel"
      >
        <ToolSectionHeading
          title="String obfuscator"
          titleId="string-obfuscator-heading"
          description={
            <ToolHint>
              Mask the middle of a secret, token, or IBAN while keeping ends (and
              spaces) visible for identification.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="string-obfuscator-input"
          label="String to obfuscate"
          full
          rows={4}
          value={text}
          placeholder="Enter string to obfuscate"
          onChange={(event) => setText(event.target.value)}
          autoFocus
          spellCheck={false}
        />

        <ToolFormGrid className="string-obfuscator-tool__controls">
          <ToolInput
            id="string-obfuscator-keep-first"
            label="Keep first"
            type="number"
            min={0}
            step={1}
            value={keepFirstRaw}
            onChange={(event) => setKeepFirstRaw(event.target.value)}
          />
          <ToolInput
            id="string-obfuscator-keep-last"
            label="Keep last"
            type="number"
            min={0}
            step={1}
            value={keepLastRaw}
            onChange={(event) => setKeepLastRaw(event.target.value)}
          />
          <ToolCheck
            id="string-obfuscator-keep-space"
            label="Keep spaces"
            toggle
            checked={keepSpace}
            onChange={(event) => setKeepSpace(event.target.checked)}
          />
        </ToolFormGrid>

        <ToolInput
          id="string-obfuscator-output"
          label="Obfuscated string"
          full
          readOnly
          value={obfuscated}
          placeholder="Obfuscated output will appear here"
          className="string-obfuscator-output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyObfuscated()}
            disabled={!obfuscated}
          >
            Copy obfuscated string
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}

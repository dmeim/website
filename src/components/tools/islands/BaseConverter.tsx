import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  MAX_BASE,
  MIN_BASE,
  clampBase,
  convertBaseSafe,
  getConvertBaseError,
} from "@/lib/tools/base-converter";

import "./BaseConverter.css";

const FIXED_OUTPUTS = [
  { id: "binary", label: "Binary (2)", base: 2, placeholder: "Binary version will be here…" },
  { id: "octal", label: "Octal (8)", base: 8, placeholder: "Octal version will be here…" },
  {
    id: "decimal",
    label: "Decimal (10)",
    base: 10,
    placeholder: "Decimal version will be here…",
  },
  {
    id: "hex",
    label: "Hexadecimal (16)",
    base: 16,
    placeholder: "Hexadecimal version will be here…",
  },
  {
    id: "base64",
    label: "Base64 (64)",
    base: 64,
    placeholder: "Base64 version will be here…",
  },
] as const;

export default function BaseConverter() {
  const [input, setInput] = useState("42");
  const [inputBase, setInputBase] = useState(10);
  const [outputBase, setOutputBase] = useState(42);
  const [actionStatus, setActionStatus] = useState("");

  const safeInputBase = clampBase(inputBase, 10);
  const safeOutputBase = clampBase(outputBase, 42);

  const convertArgs = useMemo(
    () => ({ value: input, fromBase: safeInputBase }),
    [input, safeInputBase],
  );

  const error = useMemo(
    () =>
      getConvertBaseError({
        ...convertArgs,
        toBase: safeOutputBase,
      }),
    [convertArgs, safeOutputBase],
  );

  const fixedValues = useMemo(
    () =>
      FIXED_OUTPUTS.map((row) => ({
        ...row,
        value: convertBaseSafe({ ...convertArgs, toBase: row.base }),
      })),
    [convertArgs],
  );

  const customValue = useMemo(
    () => convertBaseSafe({ ...convertArgs, toBase: safeOutputBase }),
    [convertArgs, safeOutputBase],
  );

  const copyValue = useCallback(async (label: string, value: string) => {
    if (!value) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(value);
      setActionStatus(`${label} copied.`);
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, []);

  return (
    <ToolIsland className="bc-tool">
      <ToolPanel labelledBy="bc-heading" className="bc-tool__panel">
        <ToolSectionHeading
          title="Integer base converter"
          titleId="bc-heading"
          description={
            <ToolHint>
              Convert an integer between bases {MIN_BASE}–{MAX_BASE} (binary,
              octal, decimal, hex, and more).
            </ToolHint>
          }
        />

        <ToolInput
          id="bc-input"
          label="Input number"
          full
          value={input}
          placeholder="Put your number here (ex: 42)"
          spellCheck={false}
          autoFocus
          onChange={(event) => setInput(event.target.value)}
          aria-invalid={error ? true : undefined}
        />

        <ToolInput
          id="bc-input-base"
          label="Input base"
          full
          type="number"
          min={MIN_BASE}
          max={MAX_BASE}
          step={1}
          value={Number.isFinite(inputBase) ? inputBase : ""}
          placeholder="Put your input base here (ex: 10)"
          onChange={(event) => {
            const next = event.target.valueAsNumber;
            setInputBase(Number.isNaN(next) ? Number.NaN : next);
          }}
        />

        {error ? (
          <ToolStatus tone="error" live="polite">
            {error}
          </ToolStatus>
        ) : null}

        <div className="bc-outputs" role="list" aria-label="Converted bases">
          {fixedValues.map((row) => (
            <div key={row.id} className="bc-output" role="listitem">
              <ToolInput
                id={`bc-out-${row.id}`}
                label={row.label}
                full
                readOnly
                value={row.value}
                placeholder={row.placeholder}
                className="tool-code bc-output__value"
                aria-live="polite"
              />
              <ToolActionRow className="bc-output__actions">
                <ToolButton
                  type="button"
                  onClick={() => void copyValue(row.label, row.value)}
                  disabled={!row.value}
                >
                  Copy
                </ToolButton>
              </ToolActionRow>
            </div>
          ))}

          <div className="bc-output bc-output--custom" role="listitem">
            <ToolInput
              id="bc-custom-base"
              label="Custom base"
              type="number"
              min={MIN_BASE}
              max={MAX_BASE}
              step={1}
              value={Number.isFinite(outputBase) ? outputBase : ""}
              onChange={(event) => {
                const next = event.target.valueAsNumber;
                setOutputBase(Number.isNaN(next) ? Number.NaN : next);
              }}
              fieldClassName="bc-custom-base"
            />
            <ToolInput
              id="bc-out-custom"
              label={`Base ${safeOutputBase}`}
              full
              readOnly
              value={customValue}
              placeholder={`Base ${safeOutputBase} will be here…`}
              className="tool-code bc-output__value"
              aria-live="polite"
            />
            <ToolActionRow className="bc-output__actions">
              <ToolButton
                type="button"
                onClick={() =>
                  void copyValue(`Base ${safeOutputBase}`, customValue)
                }
                disabled={!customValue}
              >
                Copy
              </ToolButton>
            </ToolActionRow>
          </div>
        </div>

        {actionStatus ? (
          <ToolStatus tone="success">{actionStatus}</ToolStatus>
        ) : null}
      </ToolPanel>
    </ToolIsland>
  );
}

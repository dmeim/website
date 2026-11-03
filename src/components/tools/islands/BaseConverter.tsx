import { useMemo, useState } from "react";

import {
  FormGrid,
  Input,
  KeyValue,
  Notice,
  OutputField,
  Panel,
  ToolFrame,
} from "@/ui/react";
import {
  MAX_BASE,
  MIN_BASE,
  clampBase,
  convertBaseSafe,
  getConvertBaseError,
} from "@/lib/tools/base-converter";

const FIXED_OUTPUTS = [
  { id: "binary", label: "Binary (2)", base: 2 },
  { id: "octal", label: "Octal (8)", base: 8 },
  { id: "decimal", label: "Decimal (10)", base: 10 },
  { id: "hex", label: "Hexadecimal (16)", base: 16 },
  { id: "base64", label: "Base64 (64)", base: 64 },
] as const;

export default function BaseConverter() {
  const [input, setInput] = useState("42");
  const [inputBase, setInputBase] = useState(10);
  const [outputBase, setOutputBase] = useState(42);

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

  return (
    <ToolFrame>
      <Panel
        title="Integer base converter"
        titleId="bc-heading"
        description={`Convert an integer between bases ${MIN_BASE}–${MAX_BASE} (binary, octal, decimal, hex, and more).`}
      >
        <FormGrid columns={2}>
          <Input
            id="bc-input"
            label="Input number"
            mono
            value={input}
            placeholder="Put your number here (ex: 42)"
            spellCheck={false}
            autoFocus
            onChange={(event) => setInput(event.target.value)}
            aria-invalid={error ? true : undefined}
          />
          <Input
            id="bc-input-base"
            label="Input base"
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
        </FormGrid>

        {error ? (
          <Notice tone="danger" live="polite">
            {error}
          </Notice>
        ) : null}

        <KeyValue
          aria-label="Converted bases"
          aria-live="polite"
          items={fixedValues.map((row) => ({
            label: row.label,
            value: row.value || "–",
            mono: true,
            copy: row.value ? row.value : false,
            tone: row.value ? "default" : "muted",
          }))}
        />

        <FormGrid columns={2}>
          <Input
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
          />
          <OutputField
            id="bc-out-custom"
            label={`Base ${safeOutputBase}`}
            value={customValue}
            placeholder={`Base ${safeOutputBase} will be here…`}
          />
        </FormGrid>
      </Panel>
    </ToolFrame>
  );
}

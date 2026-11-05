import { useMemo, useState } from "react";

import { Input, KeyValue, Notice, Panel, ToolFrame } from "@/ui/react";
import {
  MAX_ARABIC_TO_ROMAN,
  MIN_ARABIC_TO_ROMAN,
  arabicToRoman,
  isValidRomanNumber,
  romanToArabic,
} from "@/lib/tools/roman-numeral-converter";

const ARABIC_RANGE_HINT = `We can only convert numbers between ${MIN_ARABIC_TO_ROMAN.toLocaleString()} and ${MAX_ARABIC_TO_ROMAN.toLocaleString()}`;

export default function RomanNumeralConverter() {
  const [inputNumeral, setInputNumeral] = useState(42);
  const [inputRoman, setInputRoman] = useState("XLII");

  // NaN means the field is blank, which is an empty state and not a mistake.
  const arabicOutOfRange =
    inputNumeral < MIN_ARABIC_TO_ROMAN || inputNumeral > MAX_ARABIC_TO_ROMAN;

  const outputRoman = useMemo(
    () => (Number.isFinite(inputNumeral) ? arabicToRoman(inputNumeral) : ""),
    [inputNumeral],
  );

  const trimmedRoman = inputRoman.trim();
  const romanInvalid = !isValidRomanNumber(trimmedRoman);

  const outputNumeral = useMemo(
    () => (romanInvalid || trimmedRoman === "" ? null : romanToArabic(trimmedRoman)),
    [trimmedRoman, romanInvalid],
  );

  const outputNumeralText =
    outputNumeral === null ? "" : String(outputNumeral);

  const romanCopyable = Boolean(outputRoman) && !arabicOutOfRange;

  return (
    <ToolFrame layout="split" stagger>
      <Panel
        title="Arabic to Roman"
        titleId="rnc-arabic-heading"
        description={`Enter a number between ${MIN_ARABIC_TO_ROMAN.toLocaleString()} and ${MAX_ARABIC_TO_ROMAN.toLocaleString()} to convert it to a Roman numeral.`}
      >
        <Input
          id="rnc-arabic-input"
          label="Arabic number"
          type="number"
          min={MIN_ARABIC_TO_ROMAN}
          max={MAX_ARABIC_TO_ROMAN}
          step="any"
          value={Number.isFinite(inputNumeral) ? inputNumeral : ""}
          onChange={(event) => {
            const next = event.target.valueAsNumber;
            setInputNumeral(Number.isNaN(next) ? Number.NaN : next);
          }}
          autoFocus
          aria-invalid={arabicOutOfRange || undefined}
        />

        {arabicOutOfRange ? (
          <Notice tone="danger" live="polite">
            {ARABIC_RANGE_HINT}
          </Notice>
        ) : null}

        <KeyValue
          aria-live="polite"
          items={[
            {
              label: "Roman",
              value: outputRoman || "–",
              mono: true,
              copy: romanCopyable ? outputRoman : false,
            },
          ]}
        />
      </Panel>

      <Panel
        title="Roman to Arabic"
        titleId="rnc-roman-heading"
        description="Enter a classic uppercase Roman numeral to convert it to Arabic."
      >
        <Input
          id="rnc-roman-input"
          label="Roman numeral"
          mono
          value={inputRoman}
          placeholder="e.g. XLII"
          spellCheck={false}
          autoCapitalize="characters"
          onChange={(event) => setInputRoman(event.target.value)}
          aria-invalid={romanInvalid || undefined}
        />

        {romanInvalid ? (
          <Notice tone="danger" live="polite">
            That is not a valid Roman numeral. Use uppercase letters, like XLII.
          </Notice>
        ) : null}

        <KeyValue
          aria-live="polite"
          items={[
            {
              label: "Arabic",
              value: outputNumeralText || "–",
              mono: true,
              copy: outputNumeralText ? outputNumeralText : false,
            },
          ]}
        />
      </Panel>
    </ToolFrame>
  );
}

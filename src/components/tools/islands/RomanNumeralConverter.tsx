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
  ToolWorkspace,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  MAX_ARABIC_TO_ROMAN,
  MIN_ARABIC_TO_ROMAN,
  arabicToRoman,
  isValidRomanNumber,
  romanToArabic,
} from "@/lib/tools/roman-numeral-converter";

import "./RomanNumeralConverter.css";

const ARABIC_RANGE_HINT = `We can only convert numbers between ${MIN_ARABIC_TO_ROMAN.toLocaleString()} and ${MAX_ARABIC_TO_ROMAN.toLocaleString()}`;

export default function RomanNumeralConverter() {
  const [inputNumeral, setInputNumeral] = useState(42);
  const [inputRoman, setInputRoman] = useState("XLII");
  const [arabicStatus, setArabicStatus] = useState("");
  const [romanStatus, setRomanStatus] = useState("");

  const arabicOutOfRange =
    !Number.isFinite(inputNumeral) ||
    inputNumeral < MIN_ARABIC_TO_ROMAN ||
    inputNumeral > MAX_ARABIC_TO_ROMAN;

  const outputRoman = useMemo(
    () => (Number.isFinite(inputNumeral) ? arabicToRoman(inputNumeral) : ""),
    [inputNumeral],
  );

  const romanInvalid = !isValidRomanNumber(inputRoman);

  const outputNumeral = useMemo(
    () => (romanInvalid ? null : romanToArabic(inputRoman)),
    [inputRoman, romanInvalid],
  );

  const outputNumeralText =
    outputNumeral === null ? "" : String(outputNumeral);

  const copyRoman = useCallback(async () => {
    if (!outputRoman) {
      setArabicStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(outputRoman);
      setArabicStatus("Roman number copied.");
    } catch {
      setArabicStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [outputRoman]);

  const copyArabic = useCallback(async () => {
    if (outputNumeral === null) {
      setRomanStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(String(outputNumeral));
      setRomanStatus("Arabic number copied.");
    } catch {
      setRomanStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [outputNumeral]);

  return (
    <ToolIsland className="rnc-tool">
      <ToolWorkspace className="rnc-tool__workspace" stagger>
        <ToolPanel labelledBy="rnc-arabic-heading" className="rnc-tool__panel">
          <ToolSectionHeading
            title="Arabic to roman"
            titleId="rnc-arabic-heading"
            description={
              <ToolHint>
                Enter a number between {MIN_ARABIC_TO_ROMAN.toLocaleString()} and{" "}
                {MAX_ARABIC_TO_ROMAN.toLocaleString()} to convert it to a Roman
                numeral.
              </ToolHint>
            }
          />

          <ToolInput
            id="rnc-arabic-input"
            label="Arabic number"
            full
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
            <ToolStatus tone="error" live="polite">
              {ARABIC_RANGE_HINT}
            </ToolStatus>
          ) : null}

          <div className="rnc-result" aria-live="polite">
            <span className="rnc-result__label">Roman</span>
            <output className="rnc-result__value" htmlFor="rnc-arabic-input">
              {outputRoman || "—"}
            </output>
          </div>

          <ToolActionRow>
            <ToolButton
              type="button"
              onClick={() => void copyRoman()}
              disabled={!outputRoman || arabicOutOfRange}
            >
              Copy
            </ToolButton>
          </ToolActionRow>

          {arabicStatus ? (
            <ToolStatus tone="success">{arabicStatus}</ToolStatus>
          ) : null}
        </ToolPanel>

        <ToolPanel labelledBy="rnc-roman-heading" className="rnc-tool__panel">
          <ToolSectionHeading
            title="Roman to arabic"
            titleId="rnc-roman-heading"
            description={
              <ToolHint>
                Enter a classic uppercase Roman numeral to convert it to Arabic.
              </ToolHint>
            }
          />

          <ToolInput
            id="rnc-roman-input"
            label="Roman numeral"
            full
            value={inputRoman}
            placeholder="e.g. XLII"
            spellCheck={false}
            autoCapitalize="characters"
            onChange={(event) => setInputRoman(event.target.value)}
            aria-invalid={romanInvalid || undefined}
          />

          {romanInvalid ? (
            <ToolStatus tone="error" live="polite">
              The input you entered is not a valid roman number
            </ToolStatus>
          ) : null}

          <div className="rnc-result" aria-live="polite">
            <span className="rnc-result__label">Arabic</span>
            <output className="rnc-result__value" htmlFor="rnc-roman-input">
              {outputNumeralText || "—"}
            </output>
          </div>

          <ToolActionRow>
            <ToolButton
              type="button"
              onClick={() => void copyArabic()}
              disabled={romanInvalid || outputNumeral === null}
            >
              Copy
            </ToolButton>
          </ToolActionRow>

          {romanStatus ? (
            <ToolStatus tone="success">{romanStatus}</ToolStatus>
          ) : null}
        </ToolPanel>
      </ToolWorkspace>
    </ToolIsland>
  );
}

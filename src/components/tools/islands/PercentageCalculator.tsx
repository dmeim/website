import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolNested,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  parseOptionalNumber,
  percentOf,
  percentageIncreaseDecrease,
  xIsWhatPercentOfY,
} from "@/lib/tools/percentage-calculator";

import "./PercentageCalculator.css";

function NumberField({
  id,
  label,
  value,
  placeholder,
  onChange,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (next: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <ToolInput
      id={id}
      label={label}
      type="number"
      inputMode="decimal"
      step="any"
      value={value}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function ResultRow({
  id,
  label,
  value,
  onCopy,
}: {
  id: string;
  label: string;
  value: string;
  onCopy: (label: string, value: string) => void;
}) {
  return (
    <div className="pct-result">
      <ToolInput
        id={id}
        label={label}
        full
        readOnly
        value={value}
        placeholder="Result"
        className="tool-code pct-result__value"
        aria-live="polite"
        data-testid={id}
      />
      <ToolActionRow className="pct-result__actions">
        <ToolButton
          type="button"
          onClick={() => onCopy(label, value)}
          disabled={!value}
        >
          Copy
        </ToolButton>
      </ToolActionRow>
    </div>
  );
}

export default function PercentageCalculator() {
  const [percentageX, setPercentageX] = useState("");
  const [percentageY, setPercentageY] = useState("");
  const [numberX, setNumberX] = useState("");
  const [numberY, setNumberY] = useState("");
  const [numberFrom, setNumberFrom] = useState("");
  const [numberTo, setNumberTo] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const percentageResult = useMemo(
    () =>
      percentOf(parseOptionalNumber(percentageX), parseOptionalNumber(percentageY)),
    [percentageX, percentageY],
  );

  const numberResult = useMemo(
    () =>
      xIsWhatPercentOfY(parseOptionalNumber(numberX), parseOptionalNumber(numberY)),
    [numberX, numberY],
  );

  const changeResult = useMemo(
    () =>
      percentageIncreaseDecrease(
        parseOptionalNumber(numberFrom),
        parseOptionalNumber(numberTo),
      ),
    [numberFrom, numberTo],
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
      setActionStatus("Copy failed. Select the result and copy it manually.");
    }
  }, []);

  return (
    <ToolIsland className="pct-tool">
      <ToolPanel labelledBy="pct-heading" className="pct-tool__panel">
        <ToolSectionHeading
          title="Percentage calculator"
          titleId="pct-heading"
          description={
            <ToolHint>
              Compute X% of a value, find what percent one number is of another,
              or measure the percentage change between two numbers.
            </ToolHint>
          }
        />

        <ToolNested title="What is X% of Y" className="pct-section">
          <div className="pct-row">
            <NumberField
              id="pct-percentage-x"
              label="X (%)"
              value={percentageX}
              placeholder="X"
              autoFocus
              onChange={(next) => {
                setPercentageX(next);
                setActionStatus("");
              }}
            />
            <NumberField
              id="pct-percentage-y"
              label="Y"
              value={percentageY}
              placeholder="Y"
              onChange={(next) => {
                setPercentageY(next);
                setActionStatus("");
              }}
            />
          </div>
          <ResultRow
            id="pct-percentage-result"
            label="Result"
            value={percentageResult}
            onCopy={copyValue}
          />
        </ToolNested>

        <ToolNested title="X is what percent of Y" className="pct-section">
          <div className="pct-row">
            <NumberField
              id="pct-number-x"
              label="X"
              value={numberX}
              placeholder="X"
              onChange={(next) => {
                setNumberX(next);
                setActionStatus("");
              }}
            />
            <NumberField
              id="pct-number-y"
              label="Y"
              value={numberY}
              placeholder="Y"
              onChange={(next) => {
                setNumberY(next);
                setActionStatus("");
              }}
            />
          </div>
          <ResultRow
            id="pct-number-result"
            label="Result (%)"
            value={numberResult}
            onCopy={copyValue}
          />
        </ToolNested>

        <ToolNested
          title="Percentage increase / decrease"
          className="pct-section"
        >
          <div className="pct-row">
            <NumberField
              id="pct-number-from"
              label="From"
              value={numberFrom}
              placeholder="From"
              onChange={(next) => {
                setNumberFrom(next);
                setActionStatus("");
              }}
            />
            <NumberField
              id="pct-number-to"
              label="To"
              value={numberTo}
              placeholder="To"
              onChange={(next) => {
                setNumberTo(next);
                setActionStatus("");
              }}
            />
          </div>
          <ResultRow
            id="pct-change-result"
            label="Result (%)"
            value={changeResult}
            onCopy={copyValue}
          />
        </ToolNested>

        {actionStatus ? (
          <ToolStatus live="polite">
            {actionStatus}
          </ToolStatus>
        ) : null}
      </ToolPanel>
    </ToolIsland>
  );
}

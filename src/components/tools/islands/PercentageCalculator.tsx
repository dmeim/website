import { useMemo, useState, type ReactNode } from "react";

import {
  Fieldset,
  FormGrid,
  Input,
  OutputField,
  Panel,
  ToolFrame,
} from "@/ui/react";
import {
  parseOptionalNumber,
  percentOf,
  percentageIncreaseDecrease,
  xIsWhatPercentOfY,
} from "@/lib/tools/percentage-calculator";

function NumberField({
  id,
  label,
  value,
  placeholder,
  onChange,
  autoFocus,
  error,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (next: string) => void;
  autoFocus?: boolean;
  error?: string;
}) {
  return (
    <Input
      id={id}
      label={label}
      type="number"
      inputMode="decimal"
      step="any"
      value={value}
      placeholder={placeholder}
      autoFocus={autoFocus}
      error={error}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function Calculator({
  legend,
  resultId,
  resultLabel,
  result,
  children,
}: {
  legend: string;
  resultId: string;
  resultLabel: string;
  result: string;
  children: ReactNode;
}) {
  return (
    <Fieldset legend={legend}>
      <FormGrid columns={3}>
        {children}
        <OutputField
          id={resultId}
          label={resultLabel}
          value={result}
          placeholder="Result"
        />
      </FormGrid>
    </Fieldset>
  );
}

export default function PercentageCalculator() {
  const [percentageX, setPercentageX] = useState("");
  const [percentageY, setPercentageY] = useState("");
  const [numberX, setNumberX] = useState("");
  const [numberY, setNumberY] = useState("");
  const [numberFrom, setNumberFrom] = useState("");
  const [numberTo, setNumberTo] = useState("");

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

  return (
    <ToolFrame>
      <Panel
        title="Percentage calculator"
        titleId="pct-heading"
        description="Compute X% of a value, find what percent one number is of another, or measure the percentage change between two numbers."
      >
        <Calculator
          legend="What is X% of Y"
          resultId="pct-percentage-result"
          resultLabel="Result"
          result={percentageResult}
        >
          <NumberField
            id="pct-percentage-x"
            label="X (%)"
            value={percentageX}
            placeholder="X"
            autoFocus
            onChange={setPercentageX}
          />
          <NumberField
            id="pct-percentage-y"
            label="Y"
            value={percentageY}
            placeholder="Y"
            onChange={setPercentageY}
          />
        </Calculator>

        <Calculator
          legend="X is what percent of Y"
          resultId="pct-number-result"
          resultLabel="Result (%)"
          result={numberResult}
        >
          <NumberField
            id="pct-number-x"
            label="X"
            value={numberX}
            placeholder="X"
            onChange={setNumberX}
          />
          <NumberField
            id="pct-number-y"
            label="Y"
            value={numberY}
            placeholder="Y"
            onChange={setNumberY}
            error={parseOptionalNumber(numberY) === 0 ? "Y cannot be zero." : undefined}
          />
        </Calculator>

        <Calculator
          legend="Percentage increase / decrease"
          resultId="pct-change-result"
          resultLabel="Result (%)"
          result={changeResult}
        >
          <NumberField
            id="pct-number-from"
            label="From"
            value={numberFrom}
            placeholder="From"
            onChange={setNumberFrom}
            error={parseOptionalNumber(numberFrom) === 0 ? "From cannot be zero." : undefined}
          />
          <NumberField
            id="pct-number-to"
            label="To"
            value={numberTo}
            placeholder="To"
            onChange={setNumberTo}
          />
        </Calculator>
      </Panel>
    </ToolFrame>
  );
}

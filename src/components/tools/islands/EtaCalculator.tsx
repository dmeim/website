import { useMemo, useState } from "react";

import {
  Fieldset,
  FormGrid,
  Input,
  Notice,
  Panel,
  Select,
  Stat,
  StatGrid,
  ToolFrame,
} from "@/ui/react";
import {
  TIME_SPAN_UNITS,
  computeDurationMs,
  formatEtaRelative,
  formatMsDuration,
  parseDatetimeLocalValue,
  parsePositiveNumber,
  toDatetimeLocalValue,
  type TimeSpanUnitValue,
} from "@/lib/tools/eta-calculator";

const DEFAULT_UNIT_COUNT = "186";
const DEFAULT_UNIT_PER_SPAN = "3";
const DEFAULT_TIME_SPAN = "5";
const DEFAULT_UNIT_MULTIPLIER: TimeSpanUnitValue = 60_000;

export default function EtaCalculator() {
  const [unitCountRaw, setUnitCountRaw] = useState(DEFAULT_UNIT_COUNT);
  const [unitPerSpanRaw, setUnitPerSpanRaw] = useState(DEFAULT_UNIT_PER_SPAN);
  const [timeSpanRaw, setTimeSpanRaw] = useState(DEFAULT_TIME_SPAN);
  const [unitMultiplier, setUnitMultiplier] = useState<TimeSpanUnitValue>(
    DEFAULT_UNIT_MULTIPLIER,
  );
  const [startedAtLocal, setStartedAtLocal] = useState(() =>
    toDatetimeLocalValue(Date.now()),
  );

  const unitCount = parsePositiveNumber(unitCountRaw);
  const unitPerSpan = parsePositiveNumber(unitPerSpanRaw);
  const timeSpan = parsePositiveNumber(timeSpanRaw);
  const startedAtMs = parseDatetimeLocalValue(startedAtLocal);

  const durationMs = useMemo(() => {
    if (
      unitCount === undefined ||
      unitPerSpan === undefined ||
      timeSpan === undefined
    ) {
      return Number.NaN;
    }
    return computeDurationMs(unitCount, unitPerSpan, timeSpan, unitMultiplier);
  }, [unitCount, unitPerSpan, timeSpan, unitMultiplier]);

  const durationLabel = useMemo(
    () => formatMsDuration(durationMs),
    [durationMs],
  );

  const endLabel = useMemo(() => {
    if (!Number.isFinite(durationMs) || startedAtMs === undefined) {
      return "";
    }
    return formatEtaRelative(startedAtMs + durationMs);
  }, [durationMs, startedAtMs]);

  return (
    <ToolFrame>
      <Panel
        title="ETA calculator"
        titleId="eta-heading"
        description="With a concrete example, if you wash 5 plates in 3 minutes and you have 500 plates to wash, it will take you 5 hours to wash them all."
      >
        <FormGrid columns={2}>
          <Input
            id="eta-unit-count"
            label="Amount of element to consume"
            type="number"
            inputMode="decimal"
            min={1}
            step="any"
            value={unitCountRaw}
            autoFocus
            onChange={(event) => setUnitCountRaw(event.target.value)}
          />
          <Input
            id="eta-started-at"
            label="The consumption started at"
            type="datetime-local"
            step={1}
            value={startedAtLocal}
            onChange={(event) => setStartedAtLocal(event.target.value)}
          />
        </FormGrid>

        <Fieldset legend="Amount of unit consumed by time span">
          <FormGrid columns={3}>
            <Input
              id="eta-unit-per-span"
              label="Units"
              type="number"
              inputMode="decimal"
              min={1}
              step="any"
              value={unitPerSpanRaw}
              onChange={(event) => setUnitPerSpanRaw(event.target.value)}
            />
            <Input
              id="eta-time-span"
              label="In time span"
              type="number"
              inputMode="decimal"
              min={1}
              step="any"
              value={timeSpanRaw}
              onChange={(event) => setTimeSpanRaw(event.target.value)}
            />
            <Select
              id="eta-time-unit"
              label="Unit"
              value={String(unitMultiplier)}
              onChange={(event) => {
                const next = Number(event.target.value) as TimeSpanUnitValue;
                setUnitMultiplier(next);
              }}
              options={TIME_SPAN_UNITS.map((unit) => ({
                value: String(unit.value),
                label: unit.label,
              }))}
            />
          </FormGrid>
        </Fieldset>

        <StatGrid columns={2}>
          <Stat
            label="Total duration"
            value={durationLabel || "–"}
            live
            data-testid="eta-duration"
          />
          <Stat
            label="It will end"
            value={endLabel || "–"}
            live
            data-testid="eta-end"
          />
        </StatGrid>

        {!durationLabel || !endLabel ? (
          <Notice live="polite">
            Enter positive amounts and a valid start time to estimate the ETA.
          </Notice>
        ) : null}
      </Panel>
    </ToolFrame>
  );
}

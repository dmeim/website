import { useMemo, useState } from "react";

import {
  ToolFormGrid,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolNested,
  ToolPanel,
  ToolSectionHeading,
  ToolSelect,
  ToolStatus,
} from "@/components/tools/ui";
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

import "./EtaCalculator.css";

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
      timeSpan === undefined ||
      unitPerSpan === 0
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
    <ToolIsland className="eta-tool">
      <ToolPanel labelledBy="eta-heading" className="eta-tool__panel">
        <ToolSectionHeading
          title="ETA calculator"
          titleId="eta-heading"
          description={
            <ToolHint>
              With a concrete example, if you wash 5 plates in 3 minutes and you
              have 500 plates to wash, it will take you 5 hours to wash them all.
            </ToolHint>
          }
        />

        <ToolFormGrid>
          <ToolInput
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
          <ToolInput
            id="eta-started-at"
            label="The consumption started at"
            type="datetime-local"
            value={startedAtLocal}
            onChange={(event) => setStartedAtLocal(event.target.value)}
          />
        </ToolFormGrid>

        <ToolNested title="Amount of unit consumed by time span">
          <div className="eta-rate">
            <ToolInput
              id="eta-unit-per-span"
              label="Units"
              type="number"
              inputMode="decimal"
              min={1}
              step="any"
              value={unitPerSpanRaw}
              onChange={(event) => setUnitPerSpanRaw(event.target.value)}
            />
            <span className="eta-rate__in" aria-hidden="true">
              in
            </span>
            <ToolInput
              id="eta-time-span"
              label="Time span"
              type="number"
              inputMode="decimal"
              min={1}
              step="any"
              value={timeSpanRaw}
              onChange={(event) => setTimeSpanRaw(event.target.value)}
            />
            <ToolSelect
              id="eta-time-unit"
              label="Unit"
              value={String(unitMultiplier)}
              onChange={(event) => {
                const next = Number(event.target.value) as TimeSpanUnitValue;
                setUnitMultiplier(next);
              }}
            >
              {TIME_SPAN_UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </ToolSelect>
          </div>
        </ToolNested>

        <div className="eta-results" aria-live="polite">
          <div className="eta-stat">
            <p className="eta-stat__label">Total duration</p>
            <p className="eta-stat__value" data-testid="eta-duration">
              {durationLabel || "—"}
            </p>
          </div>
          <div className="eta-stat">
            <p className="eta-stat__label">It will end</p>
            <p className="eta-stat__value" data-testid="eta-end">
              {endLabel || "—"}
            </p>
          </div>
        </div>

        {!durationLabel || !endLabel ? (
          <ToolStatus live="polite">
            Enter positive amounts and a valid start time to estimate the ETA.
          </ToolStatus>
        ) : null}
      </ToolPanel>
    </ToolIsland>
  );
}

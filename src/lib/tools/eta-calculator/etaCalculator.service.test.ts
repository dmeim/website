import { describe, expect, it } from "vitest";

import {
  TIME_SPAN_UNITS,
  computeDurationMs,
  differenceInCalendarDays,
  formatEtaRelative,
  formatMsDuration,
  parseDatetimeLocalValue,
  parsePositiveNumber,
  toDatetimeLocalValue,
} from "./etaCalculator.service";

describe("eta-calculator", () => {
  describe("TIME_SPAN_UNITS", () => {
    it("matches it-tools multipliers", () => {
      expect(TIME_SPAN_UNITS.map((unit) => unit.value)).toEqual([
        1,
        1_000,
        60_000,
        3_600_000,
        86_400_000,
      ]);
    });
  });

  describe("computeDurationMs", () => {
    it("matches the plates example (500 plates, 5 in 3 minutes → 5 hours)", () => {
      expect(computeDurationMs(500, 5, 3, 60_000)).toBe(18_000_000);
      expect(formatMsDuration(computeDurationMs(500, 5, 3, 60_000))).toBe(
        "5 hours",
      );
    });

    it("matches it-tools default inputs (186 / 3 per 5 minutes)", () => {
      expect(computeDurationMs(186, 3, 5, 60_000)).toBe(18_600_000);
      expect(formatMsDuration(computeDurationMs(186, 3, 5, 60_000))).toBe(
        "5 hours 10 minutes",
      );
    });

    it("scales with unit multiplier", () => {
      expect(computeDurationMs(10, 2, 1, 1_000)).toBe(5_000);
    });
  });

  describe("formatMsDuration", () => {
    it("formats compound durations like date-fns formatDuration", () => {
      expect(formatMsDuration(3_661_001)).toBe("1 hour 1 minute 1 second 1 ms");
      expect(formatMsDuration(61_001)).toBe("1 minute 1 second 1 ms");
      expect(formatMsDuration(7_200_000)).toBe("2 hours");
      expect(formatMsDuration(1_000)).toBe("1 second");
    });

    it("omits zero units and returns empty for 0 ms", () => {
      expect(formatMsDuration(0)).toBe("");
    });

    it("keeps the leading space for ms-only durations (it-tools parity)", () => {
      expect(formatMsDuration(999)).toBe(" 999 ms");
    });

    it("returns empty for non-finite input", () => {
      expect(formatMsDuration(Number.POSITIVE_INFINITY)).toBe("");
      expect(formatMsDuration(Number.NaN)).toBe("");
    });
  });

  describe("formatEtaRelative", () => {
    const now = new Date(2024, 5, 15, 12, 0, 0).getTime(); // Sat 15 Jun 2024 12:00

    it("formats today / yesterday / tomorrow (en-GB)", () => {
      expect(formatEtaRelative(now + 5 * 60 * 60 * 1000 + 10 * 60 * 1000, now)).toBe(
        "today at 17:10",
      );
      expect(formatEtaRelative(now - 2 * 60 * 60 * 1000, now)).toBe(
        "today at 10:00",
      );
      expect(formatEtaRelative(now + 25 * 60 * 60 * 1000, now)).toBe(
        "tomorrow at 13:00",
      );
      expect(formatEtaRelative(now - 24 * 60 * 60 * 1000, now)).toBe(
        "yesterday at 12:00",
      );
    });

    it("formats lastWeek / nextWeek weekday tokens", () => {
      expect(formatEtaRelative(now + 5 * 24 * 60 * 60 * 1000, now)).toBe(
        "Thursday at 12:00",
      );
      expect(formatEtaRelative(now - 5 * 24 * 60 * 60 * 1000, now)).toBe(
        "last Monday at 12:00",
      );
      expect(formatEtaRelative(now - 6 * 24 * 60 * 60 * 1000, now)).toBe(
        "last Sunday at 12:00",
      );
    });

    it("falls back to dd/MM/yyyy outside the ±6 day window", () => {
      expect(formatEtaRelative(now + 40 * 24 * 60 * 60 * 1000, now)).toBe(
        "25/07/2024",
      );
      expect(formatEtaRelative(now - 7 * 24 * 60 * 60 * 1000, now)).toBe(
        "08/06/2024",
      );
    });

    it("returns empty for non-finite timestamps", () => {
      expect(formatEtaRelative(Number.NaN, now)).toBe("");
      expect(formatEtaRelative(now, Number.NaN)).toBe("");
    });
  });

  describe("differenceInCalendarDays", () => {
    it("counts local calendar days", () => {
      const a = new Date(2024, 5, 15, 23, 0, 0);
      const b = new Date(2024, 5, 14, 1, 0, 0);
      expect(differenceInCalendarDays(a, b)).toBe(1);
    });
  });

  describe("datetime-local helpers", () => {
    it("round-trips minute precision", () => {
      const ms = new Date(2024, 5, 15, 17, 10, 0).getTime();
      const local = toDatetimeLocalValue(ms);
      expect(local).toBe("2024-06-15T17:10");
      expect(parseDatetimeLocalValue(local)).toBe(ms);
    });

    it("returns undefined for empty or invalid datetime", () => {
      expect(parseDatetimeLocalValue("")).toBeUndefined();
      expect(parseDatetimeLocalValue("not-a-date")).toBeUndefined();
    });
  });

  describe("parsePositiveNumber", () => {
    it("parses finite numbers and rejects empty / invalid", () => {
      expect(parsePositiveNumber("186")).toBe(186);
      expect(parsePositiveNumber("3.5")).toBe(3.5);
      expect(parsePositiveNumber("")).toBeUndefined();
      expect(parsePositiveNumber("abc")).toBeUndefined();
    });
  });
});

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

    it("stays on whole milliseconds for awkward fractions", () => {
      expect(formatMsDuration(computeDurationMs(3, 0.3, 1, 1_000))).toBe("10 seconds");
      expect(formatMsDuration(computeDurationMs(7, 0.7, 1, 60_000))).toBe("10 minutes");
      expect(formatMsDuration(computeDurationMs(10, 3, 1, 3_600_000))).toBe("3 hours 20 minutes");
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

    it("has no leading space for ms-only durations", () => {
      expect(formatMsDuration(999)).toBe("999 ms");
    });

    it("rounds away float noise", () => {
      expect(formatMsDuration(9_999.999999999998)).toBe("10 seconds");
      expect(formatMsDuration(18_000_000.000000004)).toBe("5 hours");
      expect(formatMsDuration(59_999.6)).toBe("1 minute");
    });

    it("keeps hours past a day and handles sub-millisecond durations", () => {
      expect(formatMsDuration(90_000_000)).toBe("25 hours");
      expect(formatMsDuration(0.3)).toBe("less than 1 ms");
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

    it("says so when the date is out of range rather than printing NaN", () => {
      expect(formatEtaRelative(1e20, now)).toBe("too far in the future to show");
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
    it("round-trips second precision", () => {
      const ms = new Date(2024, 5, 15, 17, 10, 0).getTime();
      const local = toDatetimeLocalValue(ms);
      expect(local).toBe("2024-06-15T17:10:00");
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
      expect(parsePositiveNumber("0")).toBeUndefined();
      expect(parsePositiveNumber("-5")).toBeUndefined();
    });
  });
});

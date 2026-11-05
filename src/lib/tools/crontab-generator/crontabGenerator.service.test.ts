import { describe, expect, it } from "vitest";

import {
  CRON_FORMAT_DIAGRAM,
  CRON_HELPERS,
  DEFAULT_CRON_DESCRIBE_OPTIONS,
  DEFAULT_CRON_EXPRESSION,
  cronValidationMessage,
  describeCron,
  isCronValid,
} from "./crontabGenerator.service";

describe("crontab-generator", () => {
  describe("isCronValid", () => {
    it("accepts the default expression and common 5-field schedules", () => {
      expect(isCronValid(DEFAULT_CRON_EXPRESSION)).toBe(true);
      expect(isCronValid("* * * * *")).toBe(true);
      expect(isCronValid("*/10 * * * *")).toBe(true);
      expect(isCronValid("0 0 * * 0")).toBe(true);
      expect(isCronValid("30 4 1,15 * *")).toBe(true);
    });

    it("accepts 6-field expressions with seconds", () => {
      expect(isCronValid("* * * * * *")).toBe(true);
      expect(isCronValid("0 40 * * * *")).toBe(true);
    });

    it("accepts month and weekday aliases when alias option is on", () => {
      expect(isCronValid("0 0 * jan mon")).toBe(true);
      expect(isCronValid("0 12 * * fri")).toBe(true);
    });

    it("accepts blank day with ?", () => {
      expect(isCronValid("0 0 ? * mon")).toBe(true);
    });

    it("rejects malformed expressions and out-of-range fields", () => {
      expect(isCronValid("invalid")).toBe(false);
      expect(isCronValid("")).toBe(false);
      expect(isCronValid("* * *")).toBe(false);
      expect(isCronValid("60 * * * *")).toBe(false);
      expect(isCronValid("* 24 * * *")).toBe(false);
      expect(isCronValid("* * 32 * *")).toBe(false);
      expect(isCronValid("* * * 13 *")).toBe(false);
      expect(isCronValid("* * * * 8")).toBe(false);
      expect(isCronValid("*/0 * * * *")).toBe(false);
      expect(isCronValid("5-1 * * * *")).toBe(false);
      expect(isCronValid("@nope")).toBe(false);
    });

    it("accepts the @ shortcuts listed in the helpers table", () => {
      for (const row of CRON_HELPERS.filter((helper) => helper.symbol.startsWith("@"))) {
        expect(isCronValid(row.symbol), row.symbol).toBe(true);
      }
    });

    it("accepts every example in the helpers table", () => {
      for (const row of CRON_HELPERS.filter((helper) => helper.example)) {
        expect(isCronValid(row.example), row.example).toBe(true);
      }
    });

    it("takes 7 as a day of week only when days start at 1", () => {
      expect(isCronValid("0 14 * * 7")).toBe(false);
      expect(isCronValid("0 14 * * 7", { dayOfWeekStartIndexZero: false })).toBe(true);
    });
  });

  describe("describeCron", () => {
    it("describes the default expression with default options", () => {
      expect(describeCron(DEFAULT_CRON_EXPRESSION)).toBe(
        "At 40 minutes past the hour, every hour, every day",
      );
    });

    it("returns null for invalid expressions", () => {
      expect(describeCron("not a cron")).toBeNull();
      expect(describeCron("")).toBeNull();
    });

    it("describes @ shortcuts", () => {
      expect(describeCron("@daily")).toBe("At 00:00, every day");
      expect(describeCron("@hourly")).toBe(describeCron("0 * * * *"));
      expect(describeCron("@weekly")).toBe(describeCron("0 0 * * 0"));
      expect(describeCron("@reboot")).toBe("Run at startup");
    });

    it("counts day of week from 1 when days do not start at 0", () => {
      const fromOne = { ...DEFAULT_CRON_DESCRIBE_OPTIONS, dayOfWeekStartIndexZero: false };
      expect(describeCron("0 14 * * 1", fromOne)).toContain("Sunday");
      expect(describeCron("0 14 * * 7", fromOne)).toContain("Saturday");
      expect(describeCron("0 14 * * 1")).toContain("Monday");
    });

    it("honors use24HourTimeFormat", () => {
      const expr = "0 14 * * *";
      expect(
        describeCron(expr, {
          ...DEFAULT_CRON_DESCRIBE_OPTIONS,
          use24HourTimeFormat: true,
        }),
      ).toContain("14:00");
      expect(
        describeCron(expr, {
          ...DEFAULT_CRON_DESCRIBE_OPTIONS,
          use24HourTimeFormat: false,
        }),
      ).toMatch(/2:00\s*PM/i);
    });

    it("honors verbose for stepped minutes", () => {
      const verbose = describeCron("*/10 * * * *", {
        ...DEFAULT_CRON_DESCRIBE_OPTIONS,
        verbose: true,
      });
      const terse = describeCron("*/10 * * * *", {
        ...DEFAULT_CRON_DESCRIBE_OPTIONS,
        verbose: false,
      });
      expect(verbose).toBeTruthy();
      expect(terse).toBeTruthy();
      expect(verbose!.length).toBeGreaterThanOrEqual(terse!.length);
    });

    it("returns null when DOW 0 conflicts with dayOfWeekStartIndexZero false", () => {
      expect(
        describeCron("0 14 * * 0", {
          ...DEFAULT_CRON_DESCRIBE_OPTIONS,
          dayOfWeekStartIndexZero: false,
        }),
      ).toBeNull();
      expect(
        describeCron("0 14 * * 0", {
          ...DEFAULT_CRON_DESCRIBE_OPTIONS,
          dayOfWeekStartIndexZero: true,
        }),
      ).toContain("Sunday");
    });
  });

  describe("cronValidationMessage", () => {
    it("returns null for valid cron and blank input", () => {
      expect(cronValidationMessage(DEFAULT_CRON_EXPRESSION)).toBeNull();
      expect(cronValidationMessage("@daily")).toBeNull();
      expect(cronValidationMessage("")).toBeNull();
      expect(cronValidationMessage("   ")).toBeNull();
    });

    it("names the field at fault when it can", () => {
      expect(cronValidationMessage("60 * * * *")).toBe(
        "This cron is invalid: minutes part must be >= 0 and <= 59",
      );
      expect(cronValidationMessage("bad")).toMatch(/^This cron is invalid: .*5 parts/);
    });

    it("explains syntax the validator rejects even though the describer can read it", () => {
      expect(cronValidationMessage("0 0 L * *")).toBe(
        "This cron is invalid. Use 5 or 6 fields of values, ranges, lists, and steps.",
      );
    });

    it("explains day 0 when days do not start at 0", () => {
      expect(
        cronValidationMessage("0 14 * * 0", { ...DEFAULT_CRON_DESCRIBE_OPTIONS, dayOfWeekStartIndexZero: false }),
      ).toBe("This cron is invalid: DOW part must be >= 1 and <= 7");
    });
  });

  describe("reference data", () => {
    it("exposes the helpers table and format diagram", () => {
      expect(CRON_HELPERS.length).toBe(12);
      expect(CRON_HELPERS[0]?.symbol).toBe("*");
      expect(CRON_HELPERS.some((row) => row.symbol === "@reboot")).toBe(true);
      expect(CRON_FORMAT_DIAGRAM).toContain("minute (0 - 59)");
      expect(CRON_FORMAT_DIAGRAM).toContain("* * * * * * command");
    });
  });
});

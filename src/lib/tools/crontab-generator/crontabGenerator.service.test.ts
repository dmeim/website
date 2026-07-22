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

    it("rejects malformed expressions and @ shortcuts (validator needs 5+ fields)", () => {
      expect(isCronValid("invalid")).toBe(false);
      expect(isCronValid("")).toBe(false);
      expect(isCronValid("* * *")).toBe(false);
      expect(isCronValid("@daily")).toBe(false);
      expect(isCronValid("@hourly")).toBe(false);
      expect(isCronValid("@reboot")).toBe(false);
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
      expect(describeCron("@daily")).toBeNull();
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
    it("returns null for valid cron and the it-tools message otherwise", () => {
      expect(cronValidationMessage(DEFAULT_CRON_EXPRESSION)).toBeNull();
      expect(cronValidationMessage("bad")).toBe("This cron is invalid");
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

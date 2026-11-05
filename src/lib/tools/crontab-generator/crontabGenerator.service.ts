/**
 * Crontab generator — validate cron expressions and describe them in plain English.
 * Parity with it-tools crontab-generator (cron-validator + cronstrue).
 */

import { isValidCron } from "cron-validator";
import cronstrue from "cronstrue";

export type CronDescribeOptions = {
  verbose: boolean;
  dayOfWeekStartIndexZero: boolean;
  use24HourTimeFormat: boolean;
};

/** Default expression shown in it-tools. */
export const DEFAULT_CRON_EXPRESSION = "40 * * * *";

/** Default cronstrue toggles from it-tools. */
export const DEFAULT_CRON_DESCRIBE_OPTIONS: CronDescribeOptions = {
  verbose: true,
  dayOfWeekStartIndexZero: true,
  use24HourTimeFormat: true,
};

/** Options passed to cron-validator — matches it-tools. */
export const CRON_VALIDATOR_OPTIONS = {
  allowBlankDay: true,
  alias: true,
  seconds: true,
} as const;

export type CronHelper = {
  symbol: string;
  meaning: string;
  example: string;
  equivalent: string;
};

/** Reference helpers table from it-tools. */
export const CRON_HELPERS: readonly CronHelper[] = [
  {
    symbol: "*",
    meaning: "Any value",
    example: "* * * * *",
    equivalent: "Every minute",
  },
  {
    symbol: "-",
    meaning: "Range of values",
    example: "1-10 * * * *",
    equivalent: "Minutes 1 through 10",
  },
  {
    symbol: ",",
    meaning: "List of values",
    example: "1,10 * * * *",
    equivalent: "At minutes 1 and 10",
  },
  {
    symbol: "/",
    meaning: "Step values",
    example: "*/10 * * * *",
    equivalent: "Every 10 minutes",
  },
  {
    symbol: "@yearly",
    meaning: "Once every year at midnight of 1 January",
    example: "@yearly",
    equivalent: "0 0 1 1 *",
  },
  {
    symbol: "@annually",
    meaning: "Same as @yearly",
    example: "@annually",
    equivalent: "0 0 1 1 *",
  },
  {
    symbol: "@monthly",
    meaning: "Once a month at midnight on the first day",
    example: "@monthly",
    equivalent: "0 0 1 * *",
  },
  {
    symbol: "@weekly",
    meaning: "Once a week at midnight on Sunday morning",
    example: "@weekly",
    equivalent: "0 0 * * 0",
  },
  {
    symbol: "@daily",
    meaning: "Once a day at midnight",
    example: "@daily",
    equivalent: "0 0 * * *",
  },
  {
    symbol: "@midnight",
    meaning: "Same as @daily",
    example: "@midnight",
    equivalent: "0 0 * * *",
  },
  {
    symbol: "@hourly",
    meaning: "Once an hour at the beginning of the hour",
    example: "@hourly",
    equivalent: "0 * * * *",
  },
  {
    symbol: "@reboot",
    meaning: "Run at startup",
    example: "",
    equivalent: "",
  },
];

/** ASCII field diagram from it-tools. */
export const CRON_FORMAT_DIAGRAM = `┌──────────── [optional] seconds (0 - 59)
| ┌────────── minute (0 - 59)
| | ┌──────── hour (0 - 23)
| | | ┌────── day of month (1 - 31)
| | | | ┌──── month (1 - 12) OR jan,feb,mar,apr ...
| | | | | ┌── day of week (0 - 6, sunday=0) OR sun,mon ...
| | | | | |
* * * * * * command`;

const REBOOT_MACRO = "@reboot";
const REBOOT_DESCRIPTION = "Run at startup";
const GENERIC_INVALID_MESSAGE = "This cron is invalid";

/** The five-field equivalent of an `@` shortcut from the helpers table, or the input unchanged. */
function expandCronMacro(expression: string): string {
  const trimmed = expression.trim();
  const macro = CRON_HELPERS.find((row) => row.symbol === trimmed && row.symbol.startsWith("@"));
  return macro?.equivalent || trimmed;
}

/**
 * True when the expression is a valid cron: 5 or 6 fields (it-tools options) or an `@` shortcut.
 * With days starting at 1, day of week runs 1 through 7, so 7 has to pass here too.
 */
export function isCronValid(
  expression: string,
  { dayOfWeekStartIndexZero = true }: Partial<Pick<CronDescribeOptions, "dayOfWeekStartIndexZero">> = {},
): boolean {
  if (expression.trim() === REBOOT_MACRO) return true;
  return isValidCron(expandCronMacro(expression), {
    ...CRON_VALIDATOR_OPTIONS,
    allowSevenAsSunday: !dayOfWeekStartIndexZero,
  });
}

/**
 * Human-readable description of a cron expression or `@` shortcut.
 * Returns `null` when invalid or when cronstrue cannot parse with the given options
 * (e.g. DOW `0` while `dayOfWeekStartIndexZero` is false).
 */
export function describeCron(
  expression: string,
  options: CronDescribeOptions = DEFAULT_CRON_DESCRIBE_OPTIONS,
): string | null {
  if (!isCronValid(expression, options)) {
    return null;
  }

  if (expression.trim() === REBOOT_MACRO) {
    return REBOOT_DESCRIPTION;
  }

  try {
    return cronstrue.toString(expandCronMacro(expression), {
      verbose: options.verbose,
      dayOfWeekStartIndexZero: options.dayOfWeekStartIndexZero,
      use24HourTimeFormat: options.use24HourTimeFormat,
      throwExceptionOnParseError: true,
    });
  } catch {
    return null;
  }
}

/**
 * Why the expression cannot be described, or null when it can. Blank input is the empty state, not an error.
 * Uses cronstrue's field-level reason ("minutes part must be >= 0 and <= 59") when it has one.
 */
export function cronValidationMessage(
  expression: string,
  options: CronDescribeOptions = DEFAULT_CRON_DESCRIBE_OPTIONS,
): string | null {
  if (expression.trim() === "" || describeCron(expression, options) !== null) {
    return null;
  }

  try {
    cronstrue.toString(expandCronMacro(expression), {
      dayOfWeekStartIndexZero: options.dayOfWeekStartIndexZero,
      throwExceptionOnParseError: true,
    });
    return `${GENERIC_INVALID_MESSAGE}. Use 5 or 6 fields of values, ranges, lists, and steps.`;
  } catch (error) {
    // cronstrue throws both Error objects and plain "Error: ..." strings.
    return `${GENERIC_INVALID_MESSAGE}: ${String(error).replace(/^Error: /, "")}`;
  }
}

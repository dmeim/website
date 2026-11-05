/**
 * Date-time converter — native port of it-tools date-time-converter.
 * Formatters mirror date-fns@2.29 (formatISO / ISO9075 / RFC3339 / RFC7231).
 */

export type DateFormatId =
  | "js-locale"
  | "iso-8601"
  | "iso-9075"
  | "rfc-3339"
  | "rfc-7231"
  | "unix"
  | "timestamp"
  | "utc"
  | "mongo"
  | "excel";

export type DateFormatDef = {
  id: DateFormatId;
  name: string;
  fromDate: (date: Date) => string;
  toDate: (value: string) => Date;
  formatMatcher: (dateString: string) => boolean;
};

export type DateFormatResult = {
  id: DateFormatId;
  name: string;
  value: string;
};

/** Default selected format index — matches it-tools (`Timestamp`). */
export const DEFAULT_FORMAT_INDEX = 6;

const ISO8601_REGEX =
  /^([+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([.,]\d+(?!:))?)?(\17[0-5]\d([.,]\d+)?)?([zZ]|([+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;

const ISO9075_REGEX =
  /^([0-9]{4})-([0-9]{2})-([0-9]{2}) ([0-9]{2}):([0-9]{2}):([0-9]{2})(\.[0-9]{1,6})?(([+-])([0-9]{2}):([0-9]{2})|Z)?$/;

const RFC3339_REGEX =
  /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(\.[0-9]{1,9})?(([+-])([0-9]{2}):([0-9]{2})|Z)$/;

const RFC7231_REGEX =
  /^[A-Za-z]{3},\s[0-9]{2}\s[A-Za-z]{3}\s[0-9]{4}\s[0-9]{2}:[0-9]{2}:[0-9]{2}\sGMT$/;

const EXCEL_FORMAT_REGEX = /^-?\d+(\.\d+)?$/;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function createRegexMatcher(regex: RegExp) {
  return (date?: string) => date != null && regex.test(date);
}

export const isISO8601DateTimeString = createRegexMatcher(ISO8601_REGEX);
export const isISO9075DateString = createRegexMatcher(ISO9075_REGEX);
export const isRFC3339DateString = createRegexMatcher(RFC3339_REGEX);
export const isRFC7231DateString = createRegexMatcher(RFC7231_REGEX);
export const isUnixTimestamp = createRegexMatcher(/^[0-9]{1,10}$/);
export const isTimestamp = createRegexMatcher(/^[0-9]{1,13}$/);
export const isMongoObjectId = createRegexMatcher(/^[0-9a-fA-F]{24}$/);
export const isExcelFormat = createRegexMatcher(EXCEL_FORMAT_REGEX);

export function isUTCDateString(date?: string): boolean {
  if (date == null) return false;
  try {
    return new Date(date).toUTCString() === date;
  } catch {
    return false;
  }
}

function pad(value: number, length = 2): string {
  return String(Math.trunc(Math.abs(value))).padStart(length, "0");
}

/** date-fns addLeadingZeros for years, so BCE dates keep their sign. */
function padYear(year: number): string {
  return `${year < 0 ? "-" : ""}${pad(year, 4)}`;
}

function isValidDate(value: unknown): value is Date {
  return (
    Object.prototype.toString.call(value) === "[object Date]" &&
    !Number.isNaN((value as Date).getTime())
  );
}

/** date-fns formatISO (extended, complete) — local wall time + offset. */
export function formatISO(date: Date): string {
  const year = padYear(date.getFullYear());
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());

  const offset = date.getTimezoneOffset();
  let tzOffset: string;
  if (offset !== 0) {
    const absoluteOffset = Math.abs(offset);
    const hourOffset = pad(Math.floor(absoluteOffset / 60));
    const minuteOffset = pad(absoluteOffset % 60);
    const sign = offset < 0 ? "+" : "-";
    tzOffset = `${sign}${hourOffset}:${minuteOffset}`;
  } else {
    tzOffset = "Z";
  }

  return `${year}-${month}-${day}T${hour}:${minute}:${second}${tzOffset}`;
}

/** date-fns formatISO9075 (extended, complete) — local wall time, space separator. */
export function formatISO9075(date: Date): string {
  const year = padYear(date.getFullYear());
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/** date-fns formatRFC3339 (fractionDigits = 0). */
export function formatRFC3339(date: Date): string {
  const year = padYear(date.getFullYear());
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());

  const tzOffset = date.getTimezoneOffset();
  let offset: string;
  if (tzOffset !== 0) {
    const absoluteOffset = Math.abs(tzOffset);
    const hourOffset = pad(Math.floor(absoluteOffset / 60));
    const minuteOffset = pad(absoluteOffset % 60);
    const sign = tzOffset < 0 ? "+" : "-";
    offset = `${sign}${hourOffset}:${minuteOffset}`;
  } else {
    offset = "Z";
  }

  return `${year}-${month}-${day}T${hour}:${minute}:${second}${offset}`;
}

/** date-fns formatRFC7231 — always UTC. */
export function formatRFC7231(date: Date): string {
  const dayName = DAYS[date.getUTCDay()];
  const dayOfMonth = pad(date.getUTCDate());
  const monthName = MONTHS[date.getUTCMonth()];
  const year = padYear(date.getUTCFullYear());
  const hour = pad(date.getUTCHours());
  const minute = pad(date.getUTCMinutes());
  const second = pad(date.getUTCSeconds());
  return `${dayName}, ${dayOfMonth} ${monthName} ${year} ${hour}:${minute}:${second} GMT`;
}

const ISO_DATE_REGEX = /^-?(?:(\d{3})|(\d{2})(?:-?(\d{2}))?|W(\d{2})(?:-?(\d{1}))?|)$/;
const ISO_TIME_REGEX = /^(\d{2}(?:[.,]\d*)?)(?::?(\d{2}(?:[.,]\d*)?))?(?::?(\d{2}(?:[.,]\d*)?))?$/;
const ISO_TIMEZONE_REGEX = /^([+-])(\d{2})(?::?(\d{2}))?$/;
const ISO_YEAR_REGEX = /^(?:(\d{4}|[+-]\d{6})|(\d{2}|[+-]\d{4})$)/;
const MS_IN_HOUR = 3_600_000;
const MS_IN_MINUTE = 60_000;
const DAYS_IN_MONTH = [31, 0, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

function splitIsoString(value: string): { date?: string; time?: string; timezone?: string } {
  const parts = value.split(/[T ]/);
  if (parts.length > 2) return {};

  let date: string | undefined;
  let timeString: string | undefined;
  if (parts[0]!.includes(":")) {
    timeString = parts[0];
  } else {
    date = parts[0]!;
    timeString = parts[1];
    if (/[Z ]/i.test(date)) {
      date = value.split(/[Z ]/i)[0]!;
      timeString = value.slice(date.length);
    }
  }
  if (!timeString) return { date };

  const timezone = /([Z+-].*)$/.exec(timeString)?.[1];
  return {
    date,
    time: timezone ? timeString.replace(timezone, "") : timeString,
    timezone,
  };
}

/** The UTC midnight of an ISO date, or NaN. A missing year or unit counts as invalid or 1, like date-fns. */
function parseIsoDate(value: string): number {
  const yearMatch = ISO_YEAR_REGEX.exec(value);
  if (!yearMatch) return Number.NaN;
  const year = yearMatch[1] ? Number.parseInt(yearMatch[1]) : Number.parseInt(yearMatch[2]!) * 100;
  const captures = ISO_DATE_REGEX.exec(value.slice((yearMatch[1] ?? yearMatch[2]!).length));
  if (!captures) return Number.NaN;

  const unit = (raw?: string) => (raw ? Number.parseInt(raw) : 1);
  const date = new Date(0);

  if (captures[4]) {
    const week = unit(captures[4]);
    const dayOfWeek = unit(captures[5]) - 1;
    if (week < 1 || week > 53 || dayOfWeek < 0 || dayOfWeek > 6) return Number.NaN;
    date.setUTCFullYear(year, 0, 4);
    date.setUTCDate(date.getUTCDate() + (week - 1) * 7 + dayOfWeek + 1 - (date.getUTCDay() || 7));
    return date.getTime();
  }

  const dayOfYear = unit(captures[1]);
  const month = unit(captures[2]) - 1;
  const day = unit(captures[3]);
  const lastDay = DAYS_IN_MONTH[month] || (isLeapYear(year) ? 29 : 28);
  if (month < 0 || month > 11 || day < 1 || day > lastDay) return Number.NaN;
  if (dayOfYear < 1 || dayOfYear > (isLeapYear(year) ? 366 : 365)) return Number.NaN;
  date.setUTCFullYear(year, month, Math.max(dayOfYear, day));
  return date.getTime();
}

function parseIsoTime(value: string): number {
  const captures = ISO_TIME_REGEX.exec(value);
  if (!captures) return Number.NaN;
  const unit = (raw?: string) => (raw ? Number.parseFloat(raw.replace(",", ".")) || 0 : 0);
  const hours = unit(captures[1]);
  const minutes = unit(captures[2]);
  const seconds = unit(captures[3]);
  const valid =
    hours === 24
      ? minutes === 0 && seconds === 0
      : seconds < 60 && minutes < 60 && hours < 25;
  return valid ? hours * MS_IN_HOUR + minutes * MS_IN_MINUTE + seconds * 1000 : Number.NaN;
}

function parseIsoTimezone(value: string): number {
  if (value === "Z") return 0;
  const captures = ISO_TIMEZONE_REGEX.exec(value);
  if (!captures) return 0;
  const hours = Number.parseInt(captures[2]!);
  const minutes = captures[3] ? Number.parseInt(captures[3]) : 0;
  if (minutes > 59) return Number.NaN;
  return (captures[1] === "+" ? -1 : 1) * (hours * MS_IN_HOUR + minutes * MS_IN_MINUTE);
}

/**
 * date-fns parseISO. `new Date` is not a substitute: it rejects basic and week forms, rolls
 * 2023-02-31 over to March, and reads a date with no time as UTC instead of local.
 */
export function parseISO(value: string): Date {
  const { date, time, timezone } = splitIsoString(value);
  const day = date ? parseIsoDate(date) : Number.NaN;
  if (Number.isNaN(day)) return new Date(Number.NaN);

  const clock = time ? parseIsoTime(time) : 0;
  if (Number.isNaN(clock)) return new Date(Number.NaN);

  if (timezone) {
    const offset = parseIsoTimezone(timezone);
    return new Date(day + clock + offset);
  }

  // No zone means local wall time, so rebuild the UTC fields in the local zone.
  const utc = new Date(day + clock);
  const local = new Date(0);
  local.setFullYear(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
  local.setHours(utc.getUTCHours(), utc.getUTCMinutes(), utc.getUTCSeconds(), utc.getUTCMilliseconds());
  return local;
}

export function dateToExcelFormat(date: Date): string {
  return String(date.getTime() / (1000 * 60 * 60 * 24) + 25569);
}

export function excelFormatToDate(excelFormat: string | number): Date {
  return new Date((Number(excelFormat) - 25569) * 86400 * 1000);
}

/** An ObjectID holds 32 unsigned bits of seconds, so anything outside 1970 to 2106 has no ID. */
export function dateToMongoObjectId(date: Date): string {
  const seconds = Math.floor(date.getTime() / 1000);
  if (seconds < 0 || seconds > 0xffffffff) {
    throw new RangeError("Date is outside the Mongo ObjectID range");
  }
  return `${seconds.toString(16).padStart(8, "0")}0000000000000000`;
}

const toDateFromString = (value: string) => new Date(value);

export const DATE_FORMATS: DateFormatDef[] = [
  {
    id: "js-locale",
    name: "JS locale date string",
    fromDate: (date) => date.toString(),
    toDate: toDateFromString,
    formatMatcher: () => false,
  },
  {
    id: "iso-8601",
    name: "ISO 8601",
    fromDate: formatISO,
    toDate: parseISO,
    formatMatcher: (date) => isISO8601DateTimeString(date),
  },
  {
    id: "iso-9075",
    name: "ISO 9075",
    fromDate: formatISO9075,
    toDate: parseISO,
    formatMatcher: (date) => isISO9075DateString(date),
  },
  {
    id: "rfc-3339",
    name: "RFC 3339",
    fromDate: formatRFC3339,
    toDate: toDateFromString,
    formatMatcher: (date) => isRFC3339DateString(date),
  },
  {
    id: "rfc-7231",
    name: "RFC 7231",
    fromDate: formatRFC7231,
    toDate: toDateFromString,
    formatMatcher: (date) => isRFC7231DateString(date),
  },
  {
    id: "unix",
    name: "Unix timestamp",
    fromDate: (date) => String(Math.floor(date.getTime() / 1000)),
    toDate: (sec) => new Date(Number(sec) * 1000),
    formatMatcher: (date) => isUnixTimestamp(date),
  },
  {
    id: "timestamp",
    name: "Timestamp",
    fromDate: (date) => String(date.getTime()),
    toDate: (ms) => new Date(Number(ms)),
    formatMatcher: (date) => isTimestamp(date),
  },
  {
    id: "utc",
    name: "UTC format",
    fromDate: (date) => date.toUTCString(),
    toDate: toDateFromString,
    formatMatcher: (date) => isUTCDateString(date),
  },
  {
    id: "mongo",
    name: "Mongo ObjectID",
    fromDate: dateToMongoObjectId,
    toDate: (objectId) =>
      new Date(Number.parseInt(objectId.substring(0, 8), 16) * 1000),
    formatMatcher: (date) => isMongoObjectId(date),
  },
  {
    id: "excel",
    name: "Excel date/time",
    fromDate: dateToExcelFormat,
    toDate: excelFormatToDate,
    formatMatcher: isExcelFormat,
  },
];

/** Auto-detect format index from input (first matcher wins). Returns -1 if none. */
export function detectFormatIndex(value: string): number {
  return DATE_FORMATS.findIndex(({ formatMatcher }) => formatMatcher(value));
}

/** Parse input with the selected format; empty input → `fallback` (typically now). */
export function resolveDate(
  input: string,
  formatIndex: number,
  fallback: Date,
): Date | undefined {
  if (!input) return fallback;

  const format = DATE_FORMATS[formatIndex];
  if (!format) return undefined;

  try {
    const date = format.toDate(input);
    return isValidDate(date) ? date : undefined;
  } catch {
    return undefined;
  }
}

/** Whether the input is valid for the selected format (empty counts as valid). */
export function isInputValid(input: string, formatIndex: number): boolean {
  if (input === "") return true;

  const format = DATE_FORMATS[formatIndex];
  if (!format) return false;

  try {
    return isValidDate(format.toDate(input));
  } catch {
    return false;
  }
}

/** Format a date with every format definition (empty string when invalid). */
export function formatAll(
  date: Date | undefined,
  valid: boolean,
): DateFormatResult[] {
  return DATE_FORMATS.map((format) => {
    let value = "";
    if (date && valid) {
      try {
        value = format.fromDate(date);
      } catch {
        value = "";
      }
    }
    return { id: format.id, name: format.name, value };
  });
}

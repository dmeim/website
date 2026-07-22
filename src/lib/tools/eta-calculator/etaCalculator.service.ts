/** Milliseconds per time-span unit (matches it-tools select options). */
export const TIME_SPAN_UNITS = [
  { label: "milliseconds", value: 1 },
  { label: "seconds", value: 1_000 },
  { label: "minutes", value: 1_000 * 60 },
  { label: "hours", value: 1_000 * 60 * 60 },
  { label: "days", value: 1_000 * 60 * 60 * 24 },
] as const;

export type TimeSpanUnitValue = (typeof TIME_SPAN_UNITS)[number]["value"];

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function pluralUnit(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 || count === -1 ? "" : "s"}`;
}

/**
 * Total duration in ms for consuming `unitCount` units when
 * `unitPerTimeSpan` units are consumed every `timeSpan * timeSpanUnitMultiplier` ms.
 * Same formula as it-tools: `unitCount / (unitPerTimeSpan / timeSpanMs)`.
 */
export function computeDurationMs(
  unitCount: number,
  unitPerTimeSpan: number,
  timeSpan: number,
  timeSpanUnitMultiplier: number,
): number {
  const timeSpanMs = timeSpan * timeSpanUnitMultiplier;
  return unitCount / (unitPerTimeSpan / timeSpanMs);
}

/**
 * Format a millisecond duration like date-fns `formatDuration` (en) plus optional ms.
 * Zero units are omitted; only-ms durations keep the leading space from it-tools
 * (` formatDuration(...) + (ms > 0 ? \` \${ms} ms\` : '')`).
 */
export function formatMsDuration(duration: number): string {
  if (!Number.isFinite(duration)) {
    return "";
  }

  const ms = Math.floor(duration % 1000);
  const secs = Math.floor(((duration - ms) / 1000) % 60);
  const mins = Math.floor((((duration - ms) / 1000 - secs) / 60) % 60);
  const hrs = Math.floor((((duration - ms) / 1000 - secs) / 60 - mins) / 60);

  const parts: string[] = [];
  if (hrs !== 0) {
    parts.push(pluralUnit(hrs, "hour"));
  }
  if (mins !== 0) {
    parts.push(pluralUnit(mins, "minute"));
  }
  if (secs !== 0) {
    parts.push(pluralUnit(secs, "second"));
  }

  const base = parts.join(" ");
  return base + (ms > 0 ? ` ${ms} ms` : "");
}

function formatTimeEnGB(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function formatDateEnGB(date: Date): string {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Calendar-day difference (local), matching date-fns `differenceInCalendarDays`. */
export function differenceInCalendarDays(date: Date, baseDate: Date): number {
  const a = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const b = Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  return Math.round((a - b) / 86_400_000);
}

/**
 * Relative end time like date-fns `formatRelative(..., { locale: enGB })`.
 * Tokens: lastWeek / yesterday / today / tomorrow / nextWeek / other (dd/MM/yyyy).
 */
export function formatEtaRelative(endAtMs: number, nowMs: number = Date.now()): string {
  if (!Number.isFinite(endAtMs) || !Number.isFinite(nowMs)) {
    return "";
  }

  const date = new Date(endAtMs);
  const base = new Date(nowMs);
  const diff = differenceInCalendarDays(date, base);
  const time = formatTimeEnGB(date);
  const weekday = WEEKDAYS[date.getDay()];

  if (diff < -6) {
    return formatDateEnGB(date);
  }
  if (diff < -1) {
    return `last ${weekday} at ${time}`;
  }
  if (diff < 0) {
    return `yesterday at ${time}`;
  }
  if (diff < 1) {
    return `today at ${time}`;
  }
  if (diff < 2) {
    return `tomorrow at ${time}`;
  }
  if (diff < 7) {
    return `${weekday} at ${time}`;
  }
  return formatDateEnGB(date);
}

/** Local wall time for `<input type="datetime-local">` (minute precision). */
export function toDatetimeLocalValue(ms: number): string {
  const date = new Date(ms);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** Parse a datetime-local string to epoch ms; invalid → `undefined`. */
export function parseDatetimeLocalValue(value: string): number | undefined {
  if (value.trim() === "") {
    return undefined;
  }
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : undefined;
}

/** Parse a positive number field; empty / invalid → `undefined`. */
export function parsePositiveNumber(raw: string): number | undefined {
  if (raw.trim() === "") {
    return undefined;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

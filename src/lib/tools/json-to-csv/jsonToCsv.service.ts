/**
 * JSON to CSV.
 * Parity with it-tools json-to-csv (JSON5.parse + header union), except cells follow RFC 4180 quoting
 * and nested values stay readable as JSON, so spreadsheets and CSV parsers read the output back correctly.
 */
import JSON5 from "json5";

export const DEFAULT_RAW_JSON = "";

export function getHeaders({
  array,
}: {
  array: Record<string, unknown>[];
}): string[] {
  const headers = new Set<string>();

  array.forEach((item) => Object.keys(item).forEach((key) => headers.add(key)));

  return Array.from(headers);
}

function quoteCell(cell: string): string {
  return /[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

function serializeValue(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "";
  }

  return quoteCell(typeof value === "object" ? JSON.stringify(value) : String(value));
}

export function convertArrayToCsv({
  array,
}: {
  array: Record<string, unknown>[];
}): string {
  const headers = getHeaders({ array });

  // Own keys only, so a "constructor" column stays empty on rows that lack it.
  const rows = array.map((item) =>
    headers.map((header) => serializeValue(Object.hasOwn(item, header) ? item[header] : undefined)),
  );

  return [headers.map(quoteCell), ...rows].join("\n");
}

function isArrayOfObjects(value: unknown): value is Record<string, unknown>[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "object" && item !== null && !Array.isArray(item))
  );
}

/** Blank input is the empty state, so it is valid. */
export function isValidJson(value: string): boolean {
  if (value.trim() === "") return true;
  try {
    JSON5.parse(value);
    return true;
  } catch {
    return false;
  }
}

/** A message for input that is not JSON or not an array of objects, or null when it can be converted. */
export function getJsonError(value: string): string | null {
  if (value.trim() === "") return null;
  try {
    return isArrayOfObjects(JSON5.parse(value))
      ? null
      : 'Provided JSON must be an array of objects, like [{"name": "Ada"}].';
  } catch (error) {
    const detail = error instanceof Error ? error.message.replace(/^JSON5: /, "") : "";
    return detail ? `Provided JSON is not valid: ${detail}.` : "Provided JSON is not valid.";
  }
}

/**
 * Parse JSON5 and convert an array of objects to CSV.
 * Returns "" on parse failure or non-convertible input (matches it-tools `withDefaultOnError`).
 */
export function jsonToCsv(rawJson: string): string {
  try {
    if (rawJson.trim() === "") {
      return "";
    }
    const parsed: unknown = JSON5.parse(rawJson);
    return isArrayOfObjects(parsed) ? convertArrayToCsv({ array: parsed }) : "";
  } catch {
    return "";
  }
}

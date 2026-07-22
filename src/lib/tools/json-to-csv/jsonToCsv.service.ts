/**
 * JSON to CSV.
 * Parity with it-tools json-to-csv: JSON5.parse + header union + serializeValue rules.
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

function serializeValue(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "";
  }

  const valueAsString = String(value)
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/"/g, '\\"');

  if (valueAsString.includes(",")) {
    return `"${valueAsString}"`;
  }

  return valueAsString;
}

export function convertArrayToCsv({
  array,
}: {
  array: Record<string, unknown>[];
}): string {
  const headers = getHeaders({ array });

  const rows = array.map((item) =>
    headers.map((header) => serializeValue(item[header])),
  );

  return [headers.join(","), ...rows].join("\n");
}

/** Empty input is valid (matches it-tools validation). */
export function isValidJson(value: string): boolean {
  if (value === "") return true;
  try {
    JSON5.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse JSON5 and convert an array of objects to CSV.
 * Returns "" on parse failure or non-convertible input (matches it-tools `withDefaultOnError`).
 */
export function jsonToCsv(rawJson: string): string {
  try {
    if (rawJson === "") {
      return "";
    }
    return convertArrayToCsv({ array: JSON5.parse(rawJson) });
  } catch {
    return "";
  }
}

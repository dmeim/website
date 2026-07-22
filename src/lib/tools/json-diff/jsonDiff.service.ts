/**
 * Compare two JSON values and produce a nested difference tree.
 * Parity with it-tools json-diff models (JSON5 parse + structural diff).
 * Deep equality is implemented without lodash.
 */
import JSON5 from "json5";

import type { Difference, DifferenceStatus } from "./jsonDiff.types";

export type { Difference, DifferenceStatus, ArrayDifference, ObjectDifference, ValueDifference } from "./jsonDiff.types";

/** Empty string is valid (no parse attempt); otherwise JSON5 must parse. */
export function isValidJsonInput(value: string): boolean {
  if (value === "") return true;
  try {
    JSON5.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse JSON5 input. Returns `undefined` when empty or when parse throws
 * (matches it-tools `withDefaultOnError(..., undefined)`).
 */
export function parseJsonInput(value: string): unknown | undefined {
  if (value === "") return undefined;
  try {
    return JSON5.parse(value);
  } catch {
    return undefined;
  }
}

export function areDeepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => areDeepEqual(item, b[index]));
  }

  if (Array.isArray(a) || Array.isArray(b)) return false;

  if (typeof a === "object" && typeof b === "object") {
    const left = a as Record<string, unknown>;
    const right = b as Record<string, unknown>;
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;
    return leftKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(right, key) &&
        areDeepEqual(left[key], right[key]),
    );
  }

  return false;
}

export function formatDiffValue(value: unknown): string {
  if (value === null) return "null";
  return JSON.stringify(value);
}

export function diff(
  obj: unknown,
  newObj: unknown,
  { onlyShowDifferences = false }: { onlyShowDifferences?: boolean } = {},
): Difference {
  if (Array.isArray(obj) && Array.isArray(newObj)) {
    return {
      key: "",
      type: "array",
      children: diffArrays(obj, newObj, { onlyShowDifferences }),
      oldValue: obj,
      value: newObj,
      status: getStatus(obj, newObj),
    };
  }

  if (isObjectLike(obj) && isObjectLike(newObj)) {
    return {
      key: "",
      type: "object",
      children: diffObjects(
        obj as Record<string, unknown>,
        newObj as Record<string, unknown>,
        { onlyShowDifferences },
      ),
      oldValue: obj,
      value: newObj,
      status: getStatus(obj, newObj),
    };
  }

  return {
    key: "",
    type: "value",
    oldValue: obj,
    value: newObj,
    status: getStatus(obj, newObj),
  };
}

/** lodash `_.isObject` — true for non-null objects including arrays. */
function isObjectLike(value: unknown): boolean {
  return value !== null && typeof value === "object";
}

function diffObjects(
  obj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  { onlyShowDifferences = false }: { onlyShowDifferences?: boolean } = {},
): Difference[] {
  const keys = Object.keys({ ...obj, ...newObj });
  return keys
    .map((key) =>
      createDifference(obj?.[key], newObj?.[key], key, { onlyShowDifferences }),
    )
    .filter((entry) => !onlyShowDifferences || entry.status !== "unchanged");
}

function createDifference(
  value: unknown,
  newValue: unknown,
  key: string | number,
  { onlyShowDifferences = false }: { onlyShowDifferences?: boolean } = {},
): Difference {
  const type = getType(value);

  if (type === "object") {
    return {
      key,
      type,
      children: diffObjects(
        value as Record<string, unknown>,
        newValue as Record<string, unknown>,
        { onlyShowDifferences },
      ),
      oldValue: value,
      value: newValue,
      status: getStatus(value, newValue),
    };
  }

  if (type === "array") {
    return {
      key,
      type,
      children: diffArrays(value as unknown[], newValue as unknown[], {
        onlyShowDifferences,
      }),
      value: newValue,
      oldValue: value,
      status: getStatus(value, newValue),
    };
  }

  return {
    key,
    type,
    value: newValue,
    oldValue: value,
    status: getStatus(value, newValue),
  };
}

function diffArrays(
  arr: unknown[],
  newArr: unknown[],
  { onlyShowDifferences = false }: { onlyShowDifferences?: boolean } = {},
): Difference[] {
  const maxLength = Math.max(0, arr?.length ?? 0, newArr?.length ?? 0);
  return Array.from({ length: maxLength }, (_, i) =>
    createDifference(arr?.[i], newArr?.[i], i, { onlyShowDifferences }),
  ).filter((entry) => !onlyShowDifferences || entry.status !== "unchanged");
}

function getType(value: unknown): "object" | "array" | "value" {
  if (value === null) return "value";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return "value";
}

function getStatus(value: unknown, newValue: unknown): DifferenceStatus {
  if (value === undefined) return "added";
  if (newValue === undefined) return "removed";

  const bothAreObjects =
    getType(value) === "object" && getType(newValue) === "object";
  const bothAreArrays =
    getType(value) === "array" && getType(newValue) === "array";
  const bothAreDeepEqual = areDeepEqual(value, newValue);

  if (bothAreDeepEqual) return "unchanged";
  if (bothAreObjects || bothAreArrays) return "children-updated";
  return "updated";
}

/**
 * Regex tester — match extraction with indices, captures, and named groups.
 * Parity with it-tools regex-tester (`matchRegex` + flag composition + RandExp sample).
 */
import RandExp from "randexp";

export type GroupCapture = {
  name: string;
  value: string;
  start: number;
  end: number;
};

export type RegexMatch = {
  index: number;
  value: string;
  captures: GroupCapture[];
  groups: GroupCapture[];
};

export type RegexFlagOptions = {
  global: boolean;
  ignoreCase: boolean;
  multiline: boolean;
  dotAll: boolean;
  unicode: boolean;
  unicodeSets: boolean;
};

/** Defaults match it-tools checkbox initial state. */
export const DEFAULT_FLAG_OPTIONS: RegexFlagOptions = {
  global: true,
  ignoreCase: false,
  multiline: false,
  dotAll: true,
  unicode: true,
  unicodeSets: false,
};

export const DEFAULT_REGEX = "";
export const DEFAULT_TEXT = "";

interface RegExpGroupIndices {
  [name: string]: [number, number];
}

interface RegExpIndices extends Array<[number, number]> {
  groups: RegExpGroupIndices;
}

interface RegExpExecArrayWithIndices extends RegExpExecArray {
  indices: RegExpIndices;
}

/**
 * Compose JS RegExp flags. Always includes `d` (indices) for capture ranges.
 * When both unicode (`u`) and unicodeSets (`v`) are on, `u` wins (it-tools order).
 */
export function buildRegexFlags(options: RegexFlagOptions): string {
  let flags = "d";
  if (options.global) flags += "g";
  if (options.ignoreCase) flags += "i";
  if (options.multiline) flags += "m";
  if (options.dotAll) flags += "s";
  if (options.unicode) {
    flags += "u";
  } else if (options.unicodeSets) {
    flags += "v";
  }
  return flags;
}

/** Return an error message when `pattern` is not a valid RegExp source; else null. */
export function getRegexValidationError(pattern: string): string | null {
  try {
    void new RegExp(pattern);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

export function isValidRegex(pattern: string): boolean {
  return getRegexValidationError(pattern) === null;
}

/**
 * Find all matches (honoring `g`) with numeric captures and named groups.
 * Requires the `d` flag for indices (callers should use `buildRegexFlags`).
 * Stops on empty matches / stuck `lastIndex` to avoid infinite loops.
 */
export function matchRegex(
  regex: string,
  text: string,
  flags: string,
): RegexMatch[] {
  let lastIndex = -1;
  const re = new RegExp(regex, flags);
  const results: RegexMatch[] = [];
  let match = re.exec(text) as RegExpExecArrayWithIndices | null;

  while (match !== null) {
    if (re.lastIndex === lastIndex || match[0] === "") {
      break;
    }

    const indices = match.indices;
    const captures: GroupCapture[] = [];
    Object.entries(match).forEach(([captureName, captureValue]) => {
      if (captureName !== "0" && captureName.match(/\d+/)) {
        captures.push({
          name: captureName,
          value: captureValue as string,
          start: indices[Number(captureName)][0],
          end: indices[Number(captureName)][1],
        });
      }
    });

    const groups: GroupCapture[] = [];
    Object.entries(match.groups || {}).forEach(([groupName, groupValue]) => {
      groups.push({
        name: groupName,
        value: groupValue as string,
        start: indices.groups[groupName][0],
        end: indices.groups[groupName][1],
      });
    });

    results.push({
      index: match.index,
      value: match[0],
      captures,
      groups,
    });
    lastIndex = re.lastIndex;
    match = re.exec(text) as RegExpExecArrayWithIndices | null;
  }

  return results;
}

/**
 * Run `matchRegex`; return [] on RegExp construction / exec errors
 * (matches it-tools computed `try/catch`).
 */
export function safeMatchRegex(
  regex: string,
  text: string,
  flags: string,
): RegexMatch[] {
  try {
    return matchRegex(regex, text, flags);
  } catch {
    return [];
  }
}

/**
 * Generate a sample string that matches `pattern` (RandExp).
 * Named capture groups `(?<name>…)` are rewritten to non-capturing `(?:…)`
 * because RandExp does not support them (it-tools parity).
 */
export function generateSample(pattern: string): string {
  try {
    const sanitized = pattern.replace(/\(\?<[^>]*>/g, "(?:");
    const randexp = new RandExp(new RegExp(sanitized));
    return randexp.gen();
  } catch {
    return "";
  }
}

/**
 * Regex tester — match extraction with indices, captures, and named groups.
 * Parity with it-tools regex-tester (`matchRegex` + flag composition + RandExp sample).
 */
import RandExp from "randexp";

/** A group that did not take part in the match (`(a)|(b)` on "b") has null value and offsets. */
export type GroupCapture = {
  name: string;
  value: string | null;
  start: number | null;
  end: number | null;
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
  sticky: boolean;
};

/** Defaults match it-tools checkbox initial state. */
export const DEFAULT_FLAG_OPTIONS: RegexFlagOptions = {
  global: true,
  ignoreCase: false,
  multiline: false,
  dotAll: true,
  unicode: true,
  unicodeSets: false,
  sticky: false,
};

/** Rows beyond this would freeze the page, and nobody reads them. */
export const MAX_MATCHES = 1000;

export const DEFAULT_REGEX = "";
export const DEFAULT_TEXT = "";

type RegExpExecArrayWithIndices = RegExpExecArray & { indices: RegExpIndicesArray };

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
  if (options.sticky) flags += "y";
  return flags;
}

/**
 * Return an error message when `pattern` is not valid with `flags`; else null.
 * The flags matter: `\\-` is fine on its own but a syntax error with `u`.
 */
export function getRegexValidationError(pattern: string, flags = ""): string | null {
  try {
    void new RegExp(pattern, flags);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

export function isValidRegex(pattern: string, flags = ""): boolean {
  return getRegexValidationError(pattern, flags) === null;
}

function toGroupCapture(name: string, value: string | undefined, range: [number, number] | undefined): GroupCapture {
  return { name, value: value ?? null, start: range?.[0] ?? null, end: range?.[1] ?? null };
}

/** Next search position after a zero-length match, stepping over a whole code point in unicode mode. */
function advancePastEmptyMatch(re: RegExp, text: string): number {
  const index = re.lastIndex;
  const isWide = (re.unicode || re.unicodeSets) && (text.codePointAt(index) ?? 0) > 0xffff;
  return index + (isWide ? 2 : 1);
}

/**
 * Find all matches (honoring `g`) with numeric captures and named groups, up to `limit`.
 * Requires the `d` flag for indices (callers should use `buildRegexFlags`).
 * Zero-length matches are skipped, not listed, and the search moves past them, so `a*` still finds "aaa" in "baaa".
 */
export function matchRegex(
  regex: string,
  text: string,
  flags: string,
  limit = Number.POSITIVE_INFINITY,
): RegexMatch[] {
  const re = new RegExp(regex, flags);
  const results: RegexMatch[] = [];
  let match = re.exec(text) as RegExpExecArrayWithIndices | null;

  while (match !== null && results.length < limit) {
    if (match[0] === "") {
      if (!re.global) break;
      re.lastIndex = advancePastEmptyMatch(re, text);
    } else {
      const { indices } = match;
      results.push({
        index: match.index,
        value: match[0],
        captures: match
          .slice(1)
          .map((value, offset) => toGroupCapture(String(offset + 1), value, indices[offset + 1])),
        groups: Object.entries(match.groups ?? {}).map(([name, value]) =>
          toGroupCapture(name, value, indices.groups?.[name]),
        ),
      });
      if (!re.global) break;
    }
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
 * because RandExp does not support them (it-tools parity). Lookbehinds `(?<=…)` and `(?<!…)` are left alone.
 */
export function generateSample(pattern: string): string {
  try {
    const sanitized = pattern.replace(/\(\?<(?![=!])[^>]*>/g, "(?:");
    const randexp = new RandExp(new RegExp(sanitized));
    return randexp.gen();
  } catch {
    return "";
  }
}

export type RegexRunRequest = {
  regex: string;
  text: string;
  flags: string;
};

export type RegexRunResult = {
  matches: RegexMatch[];
  sample: string;
};

export const EMPTY_REGEX_RUN: RegexRunResult = { matches: [], sample: "" };

/** Everything that can run away on a hostile pattern, so the page can do it off the main thread. */
export function runRegex({ regex, text, flags }: RegexRunRequest): RegexRunResult {
  let matches: RegexMatch[] = [];
  try {
    matches = matchRegex(regex, text, flags, MAX_MATCHES);
  } catch {
    // The page reports invalid patterns itself; here it only means no matches.
  }
  return { matches, sample: generateSample(regex) };
}

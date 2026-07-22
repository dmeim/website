/**
 * Transform a string into common case formats.
 * Native port of change-case@4 algorithms with it-tools stripRegexp.
 */

/** Matches it-tools: keep Latin letters (incl. accented); strip everything else as separators. */
export const CASE_STRIP_REGEXP = /[^A-Za-zÀ-ÖØ-öø-ÿ]+/gi;

const DEFAULT_SPLIT_REGEXP = [
  /([a-z0-9])([A-Z])/g,
  /([A-Z])([A-Z][a-z])/g,
];

export type CaseFormatId =
  | "lowercase"
  | "uppercase"
  | "camelcase"
  | "capitalcase"
  | "constantcase"
  | "dotcase"
  | "headercase"
  | "nocase"
  | "paramcase"
  | "pascalcase"
  | "pathcase"
  | "sentencecase"
  | "snakecase"
  | "mockingcase";

export type CaseFormat = {
  id: CaseFormatId;
  label: string;
  value: string;
};

export const DEFAULT_CASE_INPUT = "lorem ipsum dolor sit amet";

type Transform = (token: string, index: number) => string;

function replaceAll(
  input: string,
  re: RegExp | RegExp[],
  value: string,
): string {
  if (re instanceof RegExp) return input.replace(re, value);
  return re.reduce((acc, pattern) => acc.replace(pattern, value), input);
}

/** change-case `noCase` with it-tools stripRegexp. */
export function noCase(
  input: string,
  {
    delimiter = " ",
    transform = (token: string) => token.toLowerCase(),
  }: { delimiter?: string; transform?: Transform } = {},
): string {
  const result = replaceAll(
    replaceAll(input, DEFAULT_SPLIT_REGEXP, "$1\0$2"),
    CASE_STRIP_REGEXP,
    "\0",
  );

  let start = 0;
  let end = result.length;
  while (result.charAt(start) === "\0") start += 1;
  while (result.charAt(end - 1) === "\0") end -= 1;

  return result
    .slice(start, end)
    .split("\0")
    .map(transform)
    .join(delimiter);
}

function pascalCaseTransform(input: string, index: number): string {
  const firstChar = input.charAt(0);
  const lowerChars = input.slice(1).toLowerCase();
  if (index > 0 && firstChar >= "0" && firstChar <= "9") {
    return `_${firstChar}${lowerChars}`;
  }
  return `${firstChar.toUpperCase()}${lowerChars}`;
}

function camelCaseTransform(input: string, index: number): string {
  if (index === 0) return input.toLowerCase();
  return pascalCaseTransform(input, index);
}

function capitalCaseTransform(input: string): string {
  const lower = input.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function sentenceCaseTransform(input: string, index: number): string {
  const lower = input.toLowerCase();
  if (index === 0) return lower.charAt(0).toUpperCase() + lower.slice(1);
  return lower;
}

export function camelCase(input: string): string {
  return noCase(input, { delimiter: "", transform: camelCaseTransform });
}

export function capitalCase(input: string): string {
  return noCase(input, {
    delimiter: " ",
    transform: (token) => capitalCaseTransform(token),
  });
}

export function constantCase(input: string): string {
  return noCase(input, {
    delimiter: "_",
    transform: (token) => token.toUpperCase(),
  });
}

export function dotCase(input: string): string {
  return noCase(input, { delimiter: "." });
}

export function headerCase(input: string): string {
  return noCase(input, {
    delimiter: "-",
    transform: (token) => capitalCaseTransform(token),
  });
}

export function paramCase(input: string): string {
  return noCase(input, { delimiter: "-" });
}

export function pascalCase(input: string): string {
  return noCase(input, { delimiter: "", transform: pascalCaseTransform });
}

export function pathCase(input: string): string {
  return noCase(input, { delimiter: "/" });
}

export function sentenceCase(input: string): string {
  return noCase(input, {
    delimiter: " ",
    transform: sentenceCaseTransform,
  });
}

export function snakeCase(input: string): string {
  return noCase(input, { delimiter: "_" });
}

/** Alternating upper/lower by character index (it-tools “Mockingcase”). */
export function mockingCase(input: string): string {
  return input
    .split("")
    .map((char, index) =>
      index % 2 === 0 ? char.toUpperCase() : char.toLowerCase(),
    )
    .join("");
}

/** All formats shown by it-tools case-converter, in display order. */
export function convertAllCases(input: string): CaseFormat[] {
  return [
    { id: "lowercase", label: "Lowercase", value: input.toLocaleLowerCase() },
    { id: "uppercase", label: "Uppercase", value: input.toLocaleUpperCase() },
    { id: "camelcase", label: "Camelcase", value: camelCase(input) },
    { id: "capitalcase", label: "Capitalcase", value: capitalCase(input) },
    { id: "constantcase", label: "Constantcase", value: constantCase(input) },
    { id: "dotcase", label: "Dotcase", value: dotCase(input) },
    { id: "headercase", label: "Headercase", value: headerCase(input) },
    { id: "nocase", label: "Nocase", value: noCase(input) },
    { id: "paramcase", label: "Paramcase", value: paramCase(input) },
    { id: "pascalcase", label: "Pascalcase", value: pascalCase(input) },
    { id: "pathcase", label: "Pathcase", value: pathCase(input) },
    { id: "sentencecase", label: "Sentencecase", value: sentenceCase(input) },
    { id: "snakecase", label: "Snakecase", value: snakeCase(input) },
    { id: "mockingcase", label: "Mockingcase", value: mockingCase(input) },
  ];
}

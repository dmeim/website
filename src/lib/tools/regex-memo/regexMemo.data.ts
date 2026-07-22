/**
 * Regex memo cheatsheet content.
 * Parity with it-tools `regex-memo.content.md`.
 */

export type RegexMemoEntry = {
  /** Pattern / expression shown in the Expression column. */
  expression: string;
  /** Plain-language description of the expression. */
  description: string;
};

export type RegexMemoSection = {
  title: string;
  /** Optional parent heading when this is a nested subsection. */
  group?: string;
  entries: RegexMemoEntry[];
  notes?: string[];
};

export type RegexMemoReference = {
  label: string;
  href: string;
};

export const regexMemoSections: RegexMemoSection[] = [
  {
    title: "Normal characters",
    entries: [
      {
        expression: ". or [^\\n\\r]",
        description:
          "any character excluding a newline or carriage return",
      },
      {
        expression: "[A-Za-z]",
        description: "alphabet",
      },
      {
        expression: "[a-z]",
        description: "lowercase alphabet",
      },
      {
        expression: "[A-Z]",
        description: "uppercase alphabet",
      },
      {
        expression: "\\d or [0-9]",
        description: "digit",
      },
      {
        expression: "\\D or [^0-9]",
        description: "non-digit",
      },
      {
        expression: "_",
        description: "underscore",
      },
      {
        expression: "\\w or [A-Za-z0-9_]",
        description: "alphabet, digit or underscore",
      },
      {
        expression: "\\W or [^A-Za-z0-9_]",
        description: "inverse of \\w",
      },
      {
        expression: "\\S",
        description: "inverse of \\s",
      },
    ],
  },
  {
    title: "Whitespace characters",
    entries: [
      {
        expression: " ",
        description: "space",
      },
      {
        expression: "\\t",
        description: "tab",
      },
      {
        expression: "\\n",
        description: "newline",
      },
      {
        expression: "\\r",
        description: "carriage return",
      },
      {
        expression: "\\s",
        description: "space, tab, newline or carriage return",
      },
    ],
  },
  {
    title: "Character set",
    entries: [
      {
        expression: "[xyz]",
        description: "either x, y or z",
      },
      {
        expression: "[^xyz]",
        description: "neither x, y nor z",
      },
      {
        expression: "[1-3]",
        description: "either 1, 2 or 3",
      },
      {
        expression: "[^1-3]",
        description: "neither 1, 2 nor 3",
      },
    ],
    notes: [
      "Think of a character set as an OR operation on the single characters that are enclosed between the square brackets.",
      "Use ^ after the opening [ to “negate” the character set.",
      "Within a character set, . means a literal period.",
    ],
  },
  {
    title: "Outside a character set",
    group: "Characters that require escaping",
    entries: [
      { expression: "\\.", description: "period" },
      { expression: "\\^", description: "caret" },
      { expression: "\\$", description: "dollar sign" },
      { expression: "\\|", description: "pipe" },
      { expression: "\\\\", description: "back slash" },
      { expression: "\\/", description: "forward slash" },
      { expression: "\\(", description: "opening bracket" },
      { expression: "\\)", description: "closing bracket" },
      { expression: "\\[", description: "opening square bracket" },
      { expression: "\\]", description: "closing square bracket" },
      { expression: "\\{", description: "opening curly bracket" },
      { expression: "\\}", description: "closing curly bracket" },
    ],
  },
  {
    title: "Inside a character set",
    group: "Characters that require escaping",
    entries: [
      { expression: "\\\\", description: "back slash" },
      { expression: "\\]", description: "closing square bracket" },
    ],
    notes: [
      "A ^ must be escaped only if it occurs immediately after the opening [ of the character set.",
      "A - must be escaped only if it occurs between two alphabets or two digits.",
    ],
  },
  {
    title: "Quantifiers",
    entries: [
      { expression: "{2}", description: "exactly 2" },
      { expression: "{2,}", description: "at least 2" },
      { expression: "{2,7}", description: "at least 2 but no more than 7" },
      { expression: "*", description: "0 or more" },
      { expression: "+", description: "1 or more" },
      { expression: "?", description: "exactly 0 or 1" },
    ],
    notes: ["The quantifier goes after the expression to be quantified."],
  },
  {
    title: "Boundaries",
    entries: [
      { expression: "^", description: "start of string" },
      { expression: "$", description: "end of string" },
      { expression: "\\b", description: "word boundary" },
    ],
    notes: [
      "How word boundary matching works:",
      "At the beginning of the string if the first character is \\w.",
      "Between two adjacent characters within the string, if the first character is \\w and the second character is \\W.",
      "At the end of the string if the last character is \\w.",
    ],
  },
  {
    title: "Matching",
    entries: [
      {
        expression: "foo\\|bar",
        description: "match either foo or bar",
      },
      {
        expression: "foo(?=bar)",
        description: "match foo if it’s before bar",
      },
      {
        expression: "foo(?!bar)",
        description: "match foo if it’s not before bar",
      },
      {
        expression: "(?<=bar)foo",
        description: "match foo if it’s after bar",
      },
      {
        expression: "(?<!bar)foo",
        description: "match foo if it’s not after bar",
      },
    ],
  },
  {
    title: "Grouping and capturing",
    entries: [
      {
        expression: "(foo)",
        description: "capturing group; match and capture foo",
      },
      {
        expression: "(?:foo)",
        description:
          "non-capturing group; match foo but without capturing foo",
      },
      {
        expression: "(foo)bar\\1",
        description:
          "\\1 is a backreference to the 1st capturing group; match foobarfoo",
      },
    ],
    notes: [
      "Capturing groups are only relevant in string.match(regexp), string.matchAll(regexp), and string.replace(regexp, callback).",
      "\\N is a backreference to the Nth capturing group. Capturing groups are numbered starting from 1.",
    ],
  },
];

export const regexMemoReferences: RegexMemoReference[] = [
  {
    label: "MDN",
    href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions",
  },
  {
    label: "RegExplained",
    href: "https://leaverou.github.io/regexplained/",
  },
];

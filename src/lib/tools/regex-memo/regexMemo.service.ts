/**
 * Regex memo cheatsheet helpers.
 * Parity with it-tools regex-memo (static markdown memo).
 */

import {
  regexMemoReferences,
  regexMemoSections,
  type RegexMemoEntry,
  type RegexMemoReference,
  type RegexMemoSection,
} from "./regexMemo.data";

export type { RegexMemoEntry, RegexMemoReference, RegexMemoSection };
export { regexMemoReferences, regexMemoSections };

const SEARCH_RESULT_TITLE = "Search results";

export type RegexMemoEntryWithSection = RegexMemoEntry & {
  section: string;
  group?: string;
  notes?: string[];
};

/** Flatten all entries with their parent section title attached. */
export function flattenRegexMemoEntries(): RegexMemoEntryWithSection[] {
  return regexMemoSections.flatMap((section) =>
    section.entries.map((entry) => ({
      ...entry,
      section: section.title,
      group: section.group,
      notes: section.notes,
    })),
  );
}

/** Total number of expression entries in the memo. */
export function countRegexMemoEntries(): number {
  return flattenRegexMemoEntries().length;
}

/** Number of top-level sections (including nested escaping subsections). */
export function countRegexMemoSections(): number {
  return regexMemoSections.length;
}

function matchesQuery(entry: RegexMemoEntryWithSection, query: string): boolean {
  const haystacks = [
    entry.section,
    entry.group ?? "",
    entry.expression,
    entry.description,
    ...(entry.notes ?? []),
  ];
  return haystacks.some((value) => value.toLowerCase().includes(query));
}

/**
 * Filter memo entries by query.
 * Empty / whitespace query returns the full section list;
 * otherwise a single "Search results" group.
 */
export function filterRegexMemoSections(query: string): RegexMemoSection[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return regexMemoSections;
  }

  const needle = trimmed.toLowerCase();
  const matches = flattenRegexMemoEntries().filter((entry) =>
    matchesQuery(entry, needle),
  );

  return [
    {
      title: SEARCH_RESULT_TITLE,
      entries: matches.map(({ expression, description }) => ({
        expression,
        description,
      })),
    },
  ];
}

/** Look up the first entry whose expression contains the needle (case-insensitive). */
export function findRegexMemoEntryByExpression(
  needle: string,
): RegexMemoEntryWithSection | undefined {
  const lower = needle.toLowerCase();
  return flattenRegexMemoEntries().find((entry) =>
    entry.expression.toLowerCase().includes(lower),
  );
}

/** Stable id slug for a section title (headings / keys). */
export function slugifyRegexMemoTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Prefer the primary token when an expression lists alternatives (`a or b`). */
export function primaryRegexExpression(expression: string): string {
  const [first] = expression.split(/\s+or\s+/i);
  return (first ?? expression).trim();
}

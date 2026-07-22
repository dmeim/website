/**
 * Git memo cheatsheet helpers.
 * Parity with it-tools git-memo (static markdown memo).
 */

import {
  gitMemoSections,
  type GitMemoEntry,
  type GitMemoSection,
} from "./gitMemo.data";

export type { GitMemoEntry, GitMemoSection };
export { gitMemoSections };

const SEARCH_RESULT_TITLE = "Search results";

export type GitMemoEntryWithSection = GitMemoEntry & {
  section: string;
};

/** Flatten all entries with their parent section title attached. */
export function flattenGitMemoEntries(): GitMemoEntryWithSection[] {
  return gitMemoSections.flatMap((section) =>
    section.entries.map((entry) => ({ ...entry, section: section.title })),
  );
}

/** Total number of command entries in the memo. */
export function countGitMemoEntries(): number {
  return flattenGitMemoEntries().length;
}

/** Number of top-level sections. */
export function countGitMemoSections(): number {
  return gitMemoSections.length;
}

function matchesQuery(entry: GitMemoEntryWithSection, query: string): boolean {
  const haystacks = [entry.section, entry.description, entry.command];
  return haystacks.some((value) => value.toLowerCase().includes(query));
}

/**
 * Filter memo entries by query.
 * Empty / whitespace query returns the full section list;
 * otherwise a single "Search results" group.
 */
export function filterGitMemoSections(query: string): GitMemoSection[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return gitMemoSections;
  }

  const needle = trimmed.toLowerCase();
  const matches = flattenGitMemoEntries().filter((entry) =>
    matchesQuery(entry, needle),
  );

  return [
    {
      title: SEARCH_RESULT_TITLE,
      entries: matches.map(({ description, command }) => ({
        description,
        command,
      })),
    },
  ];
}

/** Look up the first entry whose command contains the needle (case-insensitive). */
export function findGitMemoEntryByCommand(
  needle: string,
): GitMemoEntryWithSection | undefined {
  const lower = needle.toLowerCase();
  return flattenGitMemoEntries().find((entry) =>
    entry.command.toLowerCase().includes(lower),
  );
}

/** Stable id slug for a section title (headings / keys). */
export function slugifyGitMemoTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

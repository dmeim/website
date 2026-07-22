/**
 * HTTP status code list + search helpers.
 * Parity with it-tools http-status-codes (static table + search).
 */

import {
  codesByCategories,
  type HttpStatusCategory,
  type HttpStatusCode,
  type HttpStatusType,
} from "./httpStatusCodes.data";

export type { HttpStatusCategory, HttpStatusCode, HttpStatusType };
export { codesByCategories };

export type HttpStatusCodeWithCategory = HttpStatusCode & {
  category: string;
};

const SEARCH_RESULT_CATEGORY = "Search results";

/** Flatten category groups into a single list (category attached). */
export function flattenHttpStatusCodes(): HttpStatusCodeWithCategory[] {
  return codesByCategories.flatMap(({ category, codes }) =>
    codes.map((entry) => ({ ...entry, category })),
  );
}

/** Meaning line shown under the code title (WebDAV suffix when needed). */
export function formatHttpStatusMeaning(entry: HttpStatusCode): string {
  const suffix = entry.type !== "HTTP" ? ` For ${entry.type}.` : "";
  return `${entry.description}${suffix}`;
}

/** Title line: `404 Not Found`. */
export function formatHttpStatusTitle(entry: HttpStatusCode): string {
  return `${entry.code} ${entry.name}`;
}

function matchesQuery(entry: HttpStatusCodeWithCategory, query: string): boolean {
  const haystacks = [
    String(entry.code),
    entry.name,
    entry.description,
    entry.category,
    entry.type,
  ];
  return haystacks.some((value) => value.toLowerCase().includes(query));
}

/**
 * Filter codes by query. Empty / whitespace query returns the full
 * category list; otherwise a single "Search results" group (it-tools parity).
 */
export function filterHttpStatusCategories(query: string): HttpStatusCategory[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return codesByCategories;
  }

  const needle = trimmed.toLowerCase();
  const matches = flattenHttpStatusCodes().filter((entry) =>
    matchesQuery(entry, needle),
  );

  return [{ category: SEARCH_RESULT_CATEGORY, codes: matches }];
}

/** Look up a single code by number (first match). */
export function getHttpStatusByCode(code: number): HttpStatusCodeWithCategory | undefined {
  return flattenHttpStatusCodes().find((entry) => entry.code === code);
}

/** Total number of status codes in the reference table. */
export function countHttpStatusCodes(): number {
  return flattenHttpStatusCodes().length;
}

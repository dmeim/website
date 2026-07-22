/**
 * Transform newline-separated lists (trim, dedupe, sort, wrap, join).
 * Matches it-tools list-converter behavior (lodash-free port).
 */

export type SortOrder = "asc" | "desc" | null;

export type ConvertOptions = {
  lowerCase: boolean;
  trimItems: boolean;
  itemPrefix: string;
  itemSuffix: string;
  listPrefix: string;
  listSuffix: string;
  reverseList: boolean;
  sortList: SortOrder;
  removeDuplicates: boolean;
  separator: string;
  keepLineBreaks: boolean;
};

export const DEFAULT_CONVERT_OPTIONS: ConvertOptions = {
  lowerCase: false,
  trimItems: true,
  removeDuplicates: true,
  keepLineBreaks: false,
  itemPrefix: "",
  itemSuffix: "",
  listPrefix: "",
  listSuffix: "",
  reverseList: false,
  sortList: null,
  separator: ", ",
};

function whenever<T>(condition: boolean, fn: (value: T) => T) {
  return (value: T) => (condition ? fn(value) : value);
}

function byOrder(order: "asc" | "desc") {
  return (a: string, b: string) =>
    order === "asc" ? a.localeCompare(b) : b.localeCompare(a);
}

function uniquePreserveOrder(parts: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    if (seen.has(part)) continue;
    seen.add(part);
    out.push(part);
  }
  return out;
}

/** Convert a newline-separated list using the given options. */
export function convertList(list: string, options: ConvertOptions): string {
  const lineBreak = options.keepLineBreaks ? "\n" : "";

  let parts = whenever(options.lowerCase, (text: string) =>
    text.toLowerCase(),
  )(list).split("\n");

  parts = whenever(options.removeDuplicates, uniquePreserveOrder)(parts);
  parts = whenever(options.reverseList, (items: string[]) =>
    [...items].reverse(),
  )(parts);

  if (options.sortList !== null) {
    parts = [...parts].sort(byOrder(options.sortList));
  }

  parts = parts
    .map(whenever(options.trimItems, (item: string) => item.trim()))
    .filter((item) => item !== "")
    .map((item) => options.itemPrefix + item + options.itemSuffix);

  const joined = parts.join(options.separator + lineBreak);
  return [options.listPrefix, joined, options.listSuffix].join(lineBreak);
}

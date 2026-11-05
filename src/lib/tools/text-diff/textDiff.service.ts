/**
 * Line- and character-level text comparison (parity with it-tools text-diff /
 * Monaco DiffEditor behavior, without shipping Monaco).
 */

import { diffChars, diffLines } from "diff";

export type DiffSegmentKind = "added" | "removed" | "unchanged";

export type DiffSegment = {
  kind: DiffSegmentKind;
  value: string;
  count: number;
};

export type CharPart = {
  kind: DiffSegmentKind;
  value: string;
};

export type DiffRow =
  | {
      type: "unchanged";
      left: string;
      right: string;
    }
  | {
      type: "removed";
      left: string;
      right: null;
    }
  | {
      type: "added";
      left: null;
      right: string;
    }
  | {
      type: "modified";
      left: string;
      right: string;
      leftParts: CharPart[];
      rightParts: CharPart[];
    };

/** Defaults match it-tools Monaco DiffEditor seed models. */
export const DEFAULT_ORIGINAL = "original text";
export const DEFAULT_MODIFIED = "modified text";

/** Longest a line pair may be for character highlighting; the rest show as whole-line changes. */
const CHAR_DIFF_MAX_LENGTH = 20000;
const CHAR_DIFF_TIMEOUT_MS = 50;
/** Total highlighting time per comparison, so many long lines cannot add up to a freeze. */
const CHAR_DIFF_BUDGET_MS = 300;
const LINE_DIFF_TIMEOUT_MS = 500;

export function textsAreEqual(original: string, modified: string): boolean {
  return original === modified;
}

let lastDiff: { original: string; modified: string; segments: DiffSegment[] } | null = null;

/** Rows and the unified diff need the same segments, so keep the last result. */
export function diffTextSegments(
  original: string,
  modified: string,
): DiffSegment[] {
  if (lastDiff?.original === original && lastDiff.modified === modified) {
    return lastDiff.segments;
  }

  const segments = computeSegments(original, modified);
  lastDiff = { original, modified, segments };
  return segments;
}

function computeSegments(original: string, modified: string): DiffSegment[] {
  // Without a shared final newline, jsdiff reports "b" and "b\n" as different lines.
  const suffix = needsFinalNewline(original, modified) ? "\n" : "";
  const parts = diffLines(original && original + suffix, modified && modified + suffix, {
    timeout: LINE_DIFF_TIMEOUT_MS,
  });

  // Unrelated huge inputs would freeze the page, so give up and show them as fully replaced.
  if (!parts) {
    return [
      { kind: "removed", value: original, count: countLines(original) },
      { kind: "added", value: modified, count: countLines(modified) },
    ];
  }

  return parts.map((part) => ({
    kind: part.added ? "added" : part.removed ? "removed" : "unchanged",
    value: part.value,
    count: part.count ?? countLines(part.value),
  }));
}

function needsFinalNewline(original: string, modified: string): boolean {
  return Boolean(original && modified) && !(original.endsWith("\n") && modified.endsWith("\n"));
}

/** Real line numbers per side, since added and removed rows only advance one side. */
export function numberDiffRows(rows: DiffRow[]): Array<{ left: number; right: number }> {
  let left = 0;
  let right = 0;

  return rows.map((row) => {
    if (row.left !== null) left += 1;
    if (row.right !== null) right += 1;
    return { left, right };
  });
}

export function buildDiffRows(original: string, modified: string): DiffRow[] {
  const segments = diffTextSegments(original, modified);
  const rows: DiffRow[] = [];
  const highlightDeadline = Date.now() + CHAR_DIFF_BUDGET_MS;

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i]!;
    const next = segments[i + 1];

    if (segment.kind === "unchanged") {
      for (const line of splitDiffValue(segment.value)) {
        rows.push({ type: "unchanged", left: line, right: line });
      }
      continue;
    }

    if (
      segment.kind === "removed" &&
      next?.kind === "added"
    ) {
      const leftLines = splitDiffValue(segment.value);
      const rightLines = splitDiffValue(next.value);
      const paired = Math.min(leftLines.length, rightLines.length);

      for (let j = 0; j < paired; j += 1) {
        const left = leftLines[j]!;
        const right = rightLines[j]!;
        if (left === right) {
          rows.push({ type: "unchanged", left, right });
        } else {
          rows.push({
            type: "modified",
            left,
            right,
            ...charPartsForLine(left, right, highlightDeadline),
          });
        }
      }

      for (let j = paired; j < leftLines.length; j += 1) {
        rows.push({ type: "removed", left: leftLines[j]!, right: null });
      }
      for (let j = paired; j < rightLines.length; j += 1) {
        rows.push({ type: "added", left: null, right: rightLines[j]! });
      }

      i += 1;
      continue;
    }

    if (segment.kind === "removed") {
      for (const line of splitDiffValue(segment.value)) {
        rows.push({ type: "removed", left: line, right: null });
      }
      continue;
    }

    for (const line of splitDiffValue(segment.value)) {
      rows.push({ type: "added", left: null, right: line });
    }
  }

  return rows;
}

export function formatUnifiedDiff(original: string, modified: string): string {
  return diffTextSegments(original, modified)
    .map((segment) => {
      const prefix =
        segment.kind === "added" ? "+" : segment.kind === "removed" ? "-" : " ";
      return splitDiffValue(segment.value)
        .map((line) => `${prefix}${line}`)
        .join("\n");
    })
    .filter((block) => block.length > 0)
    .join("\n");
}

function charPartsForLine(
  left: string,
  right: string,
  deadline: number,
): { leftParts: CharPart[]; rightParts: CharPart[] } {
  const parts =
    left.length + right.length <= CHAR_DIFF_MAX_LENGTH && Date.now() < deadline
      ? diffChars(left, right, { timeout: CHAR_DIFF_TIMEOUT_MS })
      : undefined;

  if (!parts) {
    return {
      leftParts: [{ kind: "removed", value: left }],
      rightParts: [{ kind: "added", value: right }],
    };
  }

  const toPart = (part: (typeof parts)[number]): CharPart => ({
    kind: part.added ? "added" : part.removed ? "removed" : "unchanged",
    value: part.value,
  });

  return {
    leftParts: parts.filter((part) => !part.added).map(toPart),
    rightParts: parts.filter((part) => !part.removed).map(toPart),
  };
}

/** Split a jsdiff chunk into display lines (strip trailing newline sentinel). */
export function splitDiffValue(value: string): string[] {
  if (value.length === 0) {
    return [];
  }

  const lines = value.split("\n");
  if (value.endsWith("\n")) {
    lines.pop();
  }
  return lines;
}

function countLines(value: string): number {
  return splitDiffValue(value).length;
}

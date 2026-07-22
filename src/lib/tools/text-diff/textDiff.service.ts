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

export function textsAreEqual(original: string, modified: string): boolean {
  return original === modified;
}

export function diffTextSegments(
  original: string,
  modified: string,
): DiffSegment[] {
  return diffLines(original, modified).map((part) => ({
    kind: part.added ? "added" : part.removed ? "removed" : "unchanged",
    value: part.value,
    count: part.count ?? countLines(part.value),
  }));
}

export function buildDiffRows(original: string, modified: string): DiffRow[] {
  const segments = diffTextSegments(original, modified);
  const rows: DiffRow[] = [];

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
            leftParts: charPartsForSide(left, right, "left"),
            rightParts: charPartsForSide(left, right, "right"),
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

function charPartsForSide(
  left: string,
  right: string,
  side: "left" | "right",
): CharPart[] {
  return diffChars(left, right)
    .filter((part) => {
      if (side === "left") {
        return !part.added;
      }
      return !part.removed;
    })
    .map((part) => ({
      kind: part.added
        ? "added"
        : part.removed
          ? "removed"
          : "unchanged",
      value: part.value,
    }));
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

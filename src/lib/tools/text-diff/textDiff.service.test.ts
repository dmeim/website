import { describe, expect, it } from "vitest";

import {
  DEFAULT_MODIFIED,
  DEFAULT_ORIGINAL,
  buildDiffRows,
  diffTextSegments,
  formatUnifiedDiff,
  splitDiffValue,
  textsAreEqual,
} from "./textDiff.service";

describe("text-diff", () => {
  describe("textsAreEqual", () => {
    it("compares exact string equality", () => {
      expect(textsAreEqual("a", "a")).toBe(true);
      expect(textsAreEqual("a", "b")).toBe(false);
      expect(textsAreEqual("", "")).toBe(true);
    });
  });

  describe("splitDiffValue", () => {
    it("splits newline-terminated chunks without a trailing empty line", () => {
      expect(splitDiffValue("a\nb\n")).toEqual(["a", "b"]);
      expect(splitDiffValue("alone")).toEqual(["alone"]);
      expect(splitDiffValue("")).toEqual([]);
      expect(splitDiffValue("\n")).toEqual([""]);
    });
  });

  describe("diffTextSegments", () => {
    it("marks unchanged identical text", () => {
      const segments = diffTextSegments("same\n", "same\n");
      expect(segments).toEqual([
        { kind: "unchanged", value: "same\n", count: 1 },
      ]);
    });

    it("detects replaced lines", () => {
      const segments = diffTextSegments("a\nb\n", "a\nc\n");
      expect(segments.map((s) => s.kind)).toEqual([
        "unchanged",
        "removed",
        "added",
      ]);
      expect(segments[1]?.value).toBe("b\n");
      expect(segments[2]?.value).toBe("c\n");
    });

    it("detects pure additions and removals", () => {
      expect(
        diffTextSegments("a\n", "a\nb\n").map((s) => s.kind),
      ).toEqual(["unchanged", "added"]);
      expect(
        diffTextSegments("a\nb\n", "a\n").map((s) => s.kind),
      ).toEqual(["unchanged", "removed"]);
    });
  });

  describe("buildDiffRows", () => {
    it("pairs consecutive remove/add into modified rows with char parts", () => {
      const rows = buildDiffRows("hello world", "hello there");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        type: "modified",
        left: "hello world",
        right: "hello there",
      });
      if (rows[0]?.type === "modified") {
        expect(rows[0].leftParts.some((p) => p.kind === "removed")).toBe(true);
        expect(rows[0].rightParts.some((p) => p.kind === "added")).toBe(true);
      }
    });

    it("keeps unchanged lines aligned", () => {
      const rows = buildDiffRows("a\nb\nc", "a\nx\nc");
      expect(rows.map((r) => r.type)).toEqual([
        "unchanged",
        "modified",
        "unchanged",
      ]);
      expect(rows[0]).toEqual({ type: "unchanged", left: "a", right: "a" });
      expect(rows[2]).toEqual({ type: "unchanged", left: "c", right: "c" });
    });

    it("emits leftover added/removed lines after pairing", () => {
      const rows = buildDiffRows("a\nb", "a\nx\ny");
      expect(rows.map((r) => r.type)).toEqual([
        "unchanged",
        "modified",
        "added",
      ]);
      expect(rows[2]).toEqual({ type: "added", left: null, right: "y" });
    });

    it("returns empty rows for empty equal inputs", () => {
      expect(buildDiffRows("", "")).toEqual([]);
    });
  });

  describe("formatUnifiedDiff", () => {
    it("prefixes lines with + / - / space", () => {
      const unified = formatUnifiedDiff("a\nb\n", "a\nc\n");
      expect(unified).toBe(" a\n-b\n+c");
    });
  });

  describe("defaults", () => {
    it("matches it-tools Monaco seed models", () => {
      expect(DEFAULT_ORIGINAL).toBe("original text");
      expect(DEFAULT_MODIFIED).toBe("modified text");
      expect(textsAreEqual(DEFAULT_ORIGINAL, DEFAULT_MODIFIED)).toBe(false);
    });
  });
});

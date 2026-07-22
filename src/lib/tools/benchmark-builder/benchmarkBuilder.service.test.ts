import { describe, expect, it } from "vitest";

import {
  arrayToMarkdownTable,
  buildBenchmarkResults,
  computeAverage,
  computeVariance,
  createSuite,
  formatBulletList,
  formatMarkdownTable,
  isNumericSample,
  parseStoredUnit,
  readStoredSuites,
  round,
  writeStoredSuites,
  type BenchmarkSuite,
} from "./benchmarkBuilder.service";

describe("benchmark-builder", () => {
  describe("round", () => {
    it("rounds to three decimal places", () => {
      expect(round(1.2344)).toBe(1.234);
      expect(round(1.2345)).toBe(1.235);
      expect(round(10)).toBe(10);
    });
  });

  describe("isNumericSample", () => {
    it("keeps numbers and drops null/non-numbers", () => {
      expect(isNumericSample(0)).toBe(true);
      expect(isNumericSample(1.5)).toBe(true);
      expect(isNumericSample(null)).toBe(false);
      expect(isNumericSample("3")).toBe(false);
      expect(isNumericSample(undefined)).toBe(false);
    });
  });

  describe("computeAverage", () => {
    it("returns 0 for empty data", () => {
      expect(computeAverage({ data: [] })).toBe(0);
    });

    it("averages numeric samples", () => {
      expect(computeAverage({ data: [5, 10] })).toBe(7.5);
      expect(computeAverage({ data: [8, 12] })).toBe(10);
    });
  });

  describe("computeVariance", () => {
    it("returns 0 for empty or single-value data", () => {
      expect(computeVariance({ data: [] })).toBe(0);
      expect(computeVariance({ data: [5] })).toBe(0);
    });

    it("computes population variance", () => {
      // mean 7.5 → squared diffs 6.25, 6.25 → variance 6.25
      expect(computeVariance({ data: [5, 10] })).toBe(6.25);
    });
  });

  describe("arrayToMarkdownTable", () => {
    it("returns empty string for empty data", () => {
      expect(arrayToMarkdownTable({ data: [] })).toBe("");
    });

    it("builds a markdown table with header map", () => {
      const table = arrayToMarkdownTable({
        data: [
          { position: 1, title: "A", size: 2 },
          { position: 2, title: "B", size: 1 },
        ],
        headerMap: {
          position: "Position",
          title: "Suite",
          size: "Samples",
        },
      });

      expect(table).toBe(
        [
          "| Position | Suite | Samples |",
          "| --- | --- | --- |",
          "| 1 | A | 2 |",
          "| 2 | B | 1 |",
        ].join("\n"),
      );
    });
  });

  describe("buildBenchmarkResults", () => {
    const suites: BenchmarkSuite[] = [
      { title: "Suite 1", data: [5, 10] },
      { title: "Suite 2", data: [8, 12] },
    ];

    it("ranks by mean and annotates slower suites", () => {
      const results = buildBenchmarkResults(suites, "ms");

      expect(results).toEqual([
        {
          position: 1,
          title: "Suite 1",
          mean: "7.5ms",
          variance: "6.25ms²",
          size: 2,
        },
        {
          position: 2,
          title: "Suite 2",
          mean: "10ms (+2.5ms ; x1.333)",
          variance: "4ms²",
          size: 2,
        },
      ]);
    });

    it("filters null samples and omits unit when blank", () => {
      const results = buildBenchmarkResults(
        [{ title: "Only", data: [1, null, 3] }],
        "  ",
      );

      expect(results).toEqual([
        {
          position: 1,
          title: "Only",
          mean: "2",
          variance: "1",
          size: 2,
        },
      ]);
    });

    it("shows infinity ratio when best mean is 0", () => {
      const results = buildBenchmarkResults(
        [
          { title: "Zero", data: [0, 0] },
          { title: "Slow", data: [2, 2] },
        ],
        "",
      );

      expect(results[0].mean).toBe("0");
      expect(results[1].mean).toBe("2 (+2 ; x∞)");
    });
  });

  describe("formatBulletList / formatMarkdownTable", () => {
    it("formats export strings", () => {
      const results = buildBenchmarkResults(
        [
          { title: "Suite 1", data: [5, 10] },
          { title: "Suite 2", data: [8, 12] },
        ],
        "ms",
      );

      expect(formatMarkdownTable(results)).toContain("| Position | Suite |");
      expect(formatBulletList(results)).toContain(" - Suite 1");
      expect(formatBulletList(results)).toContain("    - Mean: 7.5ms");
      expect(formatBulletList(results)).toContain(" - Suite 2");
    });
  });

  describe("createSuite", () => {
    it("names the next suite and seeds a zero sample", () => {
      expect(createSuite(2)).toEqual({ title: "Suite 3", data: [0] });
    });
  });

  describe("storage helpers", () => {
    it("reads defaults when missing and round-trips suites", () => {
      const store = new Map<string, string>();
      const storage: Storage = {
        get length() {
          return store.size;
        },
        clear: () => store.clear(),
        getItem: (key) => store.get(key) ?? null,
        key: (index) => [...store.keys()][index] ?? null,
        removeItem: (key) => {
          store.delete(key);
        },
        setItem: (key, value) => {
          store.set(key, value);
        },
      };

      const defaults = readStoredSuites(storage);
      expect(defaults).toHaveLength(2);
      expect(defaults[0].data).toEqual([5, 10]);

      const next: BenchmarkSuite[] = [
        { title: "A", data: [1, null] },
        { title: "B", data: [2] },
      ];
      writeStoredSuites(next, storage);
      expect(readStoredSuites(storage)).toEqual(next);
    });

    it("parses VueUse JSON-encoded unit strings", () => {
      expect(parseStoredUnit(null)).toBe("");
      expect(parseStoredUnit('"ms"')).toBe("ms");
      expect(parseStoredUnit("ms")).toBe("ms");
    });
  });
});

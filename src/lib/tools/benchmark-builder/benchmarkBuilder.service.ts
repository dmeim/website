/** Benchmark suite comparison — it-tools benchmark-builder parity. */

export type BenchmarkSuite = {
  title: string;
  /** Sample values; `null` is an empty measure slot (filtered before stats). */
  data: (number | null)[];
};

export type BenchmarkResultRow = {
  position: number;
  title: string;
  mean: string;
  variance: string;
  size: number;
};

export const SUITES_STORAGE_KEY = "benchmark-builder:suites";
export const UNIT_STORAGE_KEY = "benchmark-builder:unit";

export const DEFAULT_SUITES: BenchmarkSuite[] = [
  { title: "Suite 1", data: [5, 10] },
  { title: "Suite 2", data: [8, 12] },
];

export const EMPTY_RESET_SUITES: BenchmarkSuite[] = [
  { title: "Suite 1", data: [] },
  { title: "Suite 2", data: [] },
];

export const RESULT_HEADER = {
  position: "Position",
  title: "Suite",
  size: "Samples",
  mean: "Mean",
  variance: "Variance",
} as const;

/** Round to 3 decimal places (it-tools). */
export function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}

/** Keep numeric samples (lodash `_.isNumber` parity: typeof === "number"). */
export function isNumericSample(value: unknown): value is number {
  return typeof value === "number";
}

export function computeAverage({ data }: { data: number[] }): number {
  if (data.length === 0) {
    return 0;
  }

  return data.reduce((sum, value) => sum + value, 0) / data.length;
}

/** Population variance (mean of squared diffs), matching it-tools. */
export function computeVariance({ data }: { data: number[] }): number {
  const mean = computeAverage({ data });
  const squaredDiffs = data.map((value) => (value - mean) ** 2);
  return computeAverage({ data: squaredDiffs });
}

export function arrayToMarkdownTable({
  data,
  headerMap = {},
}: {
  data: Record<string, unknown>[];
  headerMap?: Record<string, string>;
}): string {
  if (!Array.isArray(data) || data.length === 0) {
    return "";
  }

  const headers = Object.keys(data[0]);
  const rows = data.map((obj) => Object.values(obj));

  const headerRow = `| ${headers.map((header) => headerMap[header] ?? header).join(" | ")} |`;
  const separatorRow = `| ${headers.map(() => "---").join(" | ")} |`;
  const dataRows = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");

  return `${headerRow}\n${separatorRow}\n${dataRows}`;
}

/**
 * Rank suites by ascending mean; annotate non-best rows with delta and ratio
 * vs the best mean (it-tools display format).
 */
export function buildBenchmarkResults(
  suites: BenchmarkSuite[],
  unit: string,
): BenchmarkResultRow[] {
  const cleanUnit = unit.trim();

  return suites
    .map(({ data: dirtyData, title }) => {
      const data = dirtyData.filter(isNumericSample);

      return {
        title,
        size: data.length,
        mean: computeAverage({ data }),
        variance: computeVariance({ data }),
      };
    })
    .sort((a, b) => a.mean - b.mean)
    .map(({ mean, variance, size, title }, index, ranked) => {
      const bestMean = ranked[0].mean;
      const deltaWithBestMean = mean - bestMean;
      const ratioWithBestMean =
        bestMean === 0 ? "∞" : String(round(mean / bestMean));

      const comparisonValues =
        index !== 0 && bestMean !== mean
          ? ` (+${round(deltaWithBestMean)}${cleanUnit} ; x${ratioWithBestMean})`
          : "";

      return {
        position: index + 1,
        title,
        mean: `${round(mean)}${cleanUnit}${comparisonValues}`,
        variance: `${round(variance)}${cleanUnit}${cleanUnit ? "²" : ""}`,
        size,
      };
    });
}

export function formatBulletList(results: BenchmarkResultRow[]): string {
  return results
    .flatMap(({ title, ...sections }) => [
      ` - ${title}`,
      ...Object.entries(sections).map(
        ([key, value]) =>
          `    - ${RESULT_HEADER[key as keyof typeof RESULT_HEADER] ?? key}: ${value}`,
      ),
    ])
    .join("\n");
}

export function formatMarkdownTable(results: BenchmarkResultRow[]): string {
  return arrayToMarkdownTable({
    data: results,
    headerMap: { ...RESULT_HEADER },
  });
}

function isSuite(value: unknown): value is BenchmarkSuite {
  if (!value || typeof value !== "object") {
    return false;
  }
  const suite = value as BenchmarkSuite;
  return (
    typeof suite.title === "string" &&
    Array.isArray(suite.data) &&
    suite.data.every((item) => item === null || typeof item === "number")
  );
}

export function readStoredSuites(
  storage: Pick<Storage, "getItem"> | null | undefined = typeof localStorage !==
    "undefined"
    ? localStorage
    : null,
): BenchmarkSuite[] {
  if (!storage) {
    return structuredClone(DEFAULT_SUITES);
  }

  try {
    const raw = storage.getItem(SUITES_STORAGE_KEY);
    if (raw == null || raw === "") {
      return structuredClone(DEFAULT_SUITES);
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isSuite)) {
      return structuredClone(DEFAULT_SUITES);
    }
    return parsed.map((suite) => ({
      title: suite.title,
      data: [...suite.data],
    }));
  } catch {
    return structuredClone(DEFAULT_SUITES);
  }
}

export function writeStoredSuites(
  suites: BenchmarkSuite[],
  storage: Pick<Storage, "setItem"> | null | undefined = typeof localStorage !==
    "undefined"
    ? localStorage
    : null,
): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(SUITES_STORAGE_KEY, JSON.stringify(suites));
  } catch {
    // Quota / private mode — ignore.
  }
}

/**
 * VueUse `useStorage` stringifies primitives as JSON, so a unit of `ms`
 * is stored as `"\"ms\""`. Accept both raw and JSON-encoded strings.
 */
export function parseStoredUnit(raw: string | null): string {
  if (raw == null || raw === "") {
    return "";
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : raw;
  } catch {
    return raw;
  }
}

export function readStoredUnit(
  storage: Pick<Storage, "getItem"> | null | undefined = typeof localStorage !==
    "undefined"
    ? localStorage
    : null,
): string {
  if (!storage) {
    return "";
  }
  try {
    return parseStoredUnit(storage.getItem(UNIT_STORAGE_KEY));
  } catch {
    return "";
  }
}

export function writeStoredUnit(
  unit: string,
  storage: Pick<Storage, "setItem"> | null | undefined = typeof localStorage !==
    "undefined"
    ? localStorage
    : null,
): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(UNIT_STORAGE_KEY, JSON.stringify(unit));
  } catch {
    // Quota / private mode — ignore.
  }
}

export function createSuite(existingCount: number): BenchmarkSuite {
  return {
    title: `Suite ${existingCount + 1}`,
    data: [0],
  };
}

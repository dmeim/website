import { describe, expect, it } from "vitest";
import {
  aggregateChatTokenTotals,
  formatDurationMs,
  formatTokenCount,
  formatTokensPerSecond,
  metricsForDisplay,
  parseGenerationMetadata,
  serializeGenerationMetadata,
  slimPerformance,
  slimUsage,
} from "./message-metrics";

describe("slimUsage / slimPerformance", () => {
  it("extracts token fields including reasoning", () => {
    expect(
      slimUsage({
        inputTokens: 1200,
        outputTokens: 340,
        totalTokens: 1540,
        outputTokenDetails: { reasoningTokens: 88 },
      }),
    ).toEqual({
      inputTokens: 1200,
      outputTokens: 340,
      totalTokens: 1540,
      reasoningTokens: 88,
    });
  });

  it("prefers responseTimeMs over stepTimeMs", () => {
    expect(
      slimPerformance({
        outputTokensPerSecond: 42.5,
        responseTimeMs: 1400,
        stepTimeMs: 2000,
      }),
    ).toEqual({
      outputTokensPerSecond: 42.5,
      responseTimeMs: 1400,
    });
  });

  it("falls back to stepTimeMs", () => {
    expect(slimPerformance({ stepTimeMs: 842 })).toEqual({
      responseTimeMs: 842,
    });
  });
});

describe("serialize / parse generation metadata", () => {
  it("round-trips slim metadata", () => {
    const raw = serializeGenerationMetadata({
      usage: { inputTokens: 10, outputTokens: 20 },
      performance: { outputTokensPerSecond: 12.3, responseTimeMs: 900 },
      totalUsage: { totalTokens: 30 },
    });
    expect(parseGenerationMetadata(raw)).toEqual({
      usage: { inputTokens: 10, outputTokens: 20 },
      performance: { outputTokensPerSecond: 12.3, responseTimeMs: 900 },
      totalUsage: { totalTokens: 30 },
    });
  });

  it("returns null for empty or invalid", () => {
    expect(parseGenerationMetadata(null)).toBeNull();
    expect(parseGenerationMetadata("")).toBeNull();
    expect(parseGenerationMetadata("{")).toBeNull();
  });
});

describe("formatters", () => {
  it("formats token counts", () => {
    expect(formatTokenCount(42)).toBe("42");
    expect(formatTokenCount(1200)).toBe("1.2k");
    expect(formatTokenCount(1000)).toBe("1k");
    expect(formatTokenCount(1_500_000)).toBe("1.5M");
  });

  it("formats tokens per second", () => {
    expect(formatTokensPerSecond(4.56)).toBe("4.56/s");
    expect(formatTokensPerSecond(12.34)).toBe("12.3/s");
    expect(formatTokensPerSecond(120)).toBe("120/s");
  });

  it("formats duration", () => {
    expect(formatDurationMs(842)).toBe("842ms");
    expect(formatDurationMs(1400)).toBe("1.4s");
    expect(formatDurationMs(12500)).toBe("13s");
    expect(formatDurationMs(65000)).toBe("1m 5s");
  });
});

describe("metricsForDisplay", () => {
  it("hides empty metadata and zero reasoning", () => {
    expect(metricsForDisplay(undefined)).toBeNull();
    expect(
      metricsForDisplay({
        usage: { reasoningTokens: 0, inputTokens: 5 },
      }),
    ).toEqual({ inputTokens: 5 });
  });

  it("falls back to totalUsage and includes performance", () => {
    expect(
      metricsForDisplay({
        totalUsage: { inputTokens: 1, outputTokens: 2, reasoningTokens: 9 },
        performance: { outputTokensPerSecond: 10, responseTimeMs: 500 },
      }),
    ).toEqual({
      inputTokens: 1,
      outputTokens: 2,
      reasoningTokens: 9,
      outputTokensPerSecond: 10,
      responseTimeMs: 500,
    });
  });
});

describe("aggregateChatTokenTotals", () => {
  it("returns empty totals when nothing has usage", () => {
    expect(aggregateChatTokenTotals([])).toEqual({
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      hasMetrics: false,
    });
    expect(aggregateChatTokenTotals([null, undefined, {}])).toEqual({
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      hasMetrics: false,
    });
  });

  it("sums input, output, and reasoning across turns", () => {
    expect(
      aggregateChatTokenTotals([
        { usage: { inputTokens: 100, outputTokens: 40, reasoningTokens: 10 } },
        { usage: { inputTokens: 200, outputTokens: 50 } },
        {
          totalUsage: {
            inputTokens: 50,
            outputTokens: 10,
            reasoningTokens: 5,
          },
        },
        { performance: { responseTimeMs: 900 } },
      ]),
    ).toEqual({
      inputTokens: 350,
      outputTokens: 100,
      reasoningTokens: 15,
      hasMetrics: true,
    });
  });

  it("prefers usage over totalUsage and treats missing reasoning as 0", () => {
    expect(
      aggregateChatTokenTotals([
        {
          usage: { inputTokens: 10, outputTokens: 2 },
          totalUsage: { inputTokens: 99, outputTokens: 99, reasoningTokens: 99 },
        },
      ]),
    ).toEqual({
      inputTokens: 10,
      outputTokens: 2,
      reasoningTokens: 0,
      hasMetrics: true,
    });
  });
});

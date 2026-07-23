/**
 * Slim generation metrics for UI message metadata + D1 persistence.
 */

export type ChatTokenUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  reasoningTokens?: number;
};

export type ChatPerformanceMetrics = {
  outputTokensPerSecond?: number;
  responseTimeMs?: number;
};

/** Stored on assistant messages (stream metadata + D1 JSON column). */
export type ChatGenerationMetadata = {
  usage?: ChatTokenUsage;
  performance?: ChatPerformanceMetrics;
  totalUsage?: ChatTokenUsage;
};

type UsageLike = {
  inputTokens?: number | undefined;
  outputTokens?: number | undefined;
  totalTokens?: number | undefined;
  outputTokenDetails?: {
    reasoningTokens?: number | undefined;
  };
};

type PerformanceLike = {
  outputTokensPerSecond?: number | undefined;
  responseTimeMs?: number | undefined;
  stepTimeMs?: number | undefined;
};

export function slimUsage(usage: UsageLike | null | undefined): ChatTokenUsage | undefined {
  if (!usage) return undefined;
  const reasoningTokens = usage.outputTokenDetails?.reasoningTokens;
  const slim: ChatTokenUsage = {};
  if (typeof usage.inputTokens === "number") slim.inputTokens = usage.inputTokens;
  if (typeof usage.outputTokens === "number") slim.outputTokens = usage.outputTokens;
  if (typeof usage.totalTokens === "number") slim.totalTokens = usage.totalTokens;
  if (typeof reasoningTokens === "number") slim.reasoningTokens = reasoningTokens;
  return Object.keys(slim).length > 0 ? slim : undefined;
}

export function slimPerformance(
  performance: PerformanceLike | null | undefined,
): ChatPerformanceMetrics | undefined {
  if (!performance) return undefined;
  const slim: ChatPerformanceMetrics = {};
  if (typeof performance.outputTokensPerSecond === "number") {
    slim.outputTokensPerSecond = performance.outputTokensPerSecond;
  }
  const durationMs =
    typeof performance.responseTimeMs === "number"
      ? performance.responseTimeMs
      : typeof performance.stepTimeMs === "number"
        ? performance.stepTimeMs
        : undefined;
  if (typeof durationMs === "number") slim.responseTimeMs = durationMs;
  return Object.keys(slim).length > 0 ? slim : undefined;
}

export function mergeGenerationMetadata(
  ...parts: Array<ChatGenerationMetadata | null | undefined>
): ChatGenerationMetadata | undefined {
  const merged: ChatGenerationMetadata = {};
  for (const part of parts) {
    if (!part) continue;
    if (part.usage) merged.usage = part.usage;
    if (part.performance) merged.performance = part.performance;
    if (part.totalUsage) merged.totalUsage = part.totalUsage;
  }
  return Object.keys(merged).length > 0 ? merged : undefined;
}

export function parseGenerationMetadata(
  raw: string | null | undefined,
): ChatGenerationMetadata | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as Record<string, unknown>;
    return mergeGenerationMetadata({
      usage: slimUsage(obj.usage as UsageLike | undefined),
      performance: slimPerformance(obj.performance as PerformanceLike | undefined),
      totalUsage: slimUsage(obj.totalUsage as UsageLike | undefined),
    }) ?? null;
  } catch {
    return null;
  }
}

export function serializeGenerationMetadata(
  meta: ChatGenerationMetadata | null | undefined,
): string | null {
  const merged = mergeGenerationMetadata(meta);
  if (!merged) return null;
  return JSON.stringify(merged);
}

/** Prefer step usage, fall back to aggregate totalUsage. */
export function effectiveUsage(
  meta: ChatGenerationMetadata | null | undefined,
): ChatTokenUsage | undefined {
  return meta?.usage ?? meta?.totalUsage;
}

export function formatTokenCount(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${trimTrailingZero((value / 1_000_000).toFixed(1))}M`;
  }
  if (abs >= 1_000) {
    return `${trimTrailingZero((value / 1_000).toFixed(1))}k`;
  }
  return String(Math.round(value));
}

export function formatTokensPerSecond(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "—";
  if (value >= 100) return `${Math.round(value)}/s`;
  if (value >= 10) return `${trimTrailingZero(value.toFixed(1))}/s`;
  return `${trimTrailingZero(value.toFixed(2))}/s`;
}

export function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = ms / 1000;
  if (seconds < 10) return `${trimTrailingZero(seconds.toFixed(1))}s`;
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = Math.round(seconds % 60);
  return `${minutes}m ${rem}s`;
}

function trimTrailingZero(value: string): string {
  return value.replace(/\.0$/, "");
}

export type MessageMetricsDisplay = {
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  outputTokensPerSecond?: number;
  responseTimeMs?: number;
};

export function metricsForDisplay(
  meta: ChatGenerationMetadata | null | undefined,
): MessageMetricsDisplay | null {
  if (!meta) return null;
  const usage = effectiveUsage(meta);
  const display: MessageMetricsDisplay = {};
  if (typeof usage?.inputTokens === "number") {
    display.inputTokens = usage.inputTokens;
  }
  if (typeof usage?.outputTokens === "number") {
    display.outputTokens = usage.outputTokens;
  }
  if (
    typeof usage?.reasoningTokens === "number" &&
    usage.reasoningTokens > 0
  ) {
    display.reasoningTokens = usage.reasoningTokens;
  }
  if (typeof meta.performance?.outputTokensPerSecond === "number") {
    display.outputTokensPerSecond = meta.performance.outputTokensPerSecond;
  }
  if (typeof meta.performance?.responseTimeMs === "number") {
    display.responseTimeMs = meta.performance.responseTimeMs;
  }
  return Object.keys(display).length > 0 ? display : null;
}

/** Chat-level sums of per-turn prompt/completion/reasoning tokens. */
export type ChatTokenTotals = {
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  /** True when at least one generation contributed token data. */
  hasMetrics: boolean;
};

/**
 * Sum token usage across assistant turns that have generation metadata.
 * Missing reasoning is treated as 0; performance/TPS is ignored.
 */
export function aggregateChatTokenTotals(
  generations: Array<ChatGenerationMetadata | null | undefined>,
): ChatTokenTotals {
  let inputTokens = 0;
  let outputTokens = 0;
  let reasoningTokens = 0;
  let hasMetrics = false;

  for (const gen of generations) {
    const usage = effectiveUsage(gen);
    if (!usage) continue;
    let saw = false;
    if (typeof usage.inputTokens === "number") {
      inputTokens += usage.inputTokens;
      saw = true;
    }
    if (typeof usage.outputTokens === "number") {
      outputTokens += usage.outputTokens;
      saw = true;
    }
    if (typeof usage.reasoningTokens === "number") {
      reasoningTokens += usage.reasoningTokens;
      saw = true;
    }
    if (saw) hasMetrics = true;
  }

  return { inputTokens, outputTokens, reasoningTokens, hasMetrics };
}

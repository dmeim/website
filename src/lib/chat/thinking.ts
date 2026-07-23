import type { ThinkingLevel } from "./types";

export const THINKING_LEVELS: ThinkingLevel[] = [
  "off",
  "low",
  "medium",
  "high",
  "xhigh",
];

export const THINKING_LEVEL_LABELS: Record<ThinkingLevel, string> = {
  off: "Off",
  low: "Low",
  medium: "Medium",
  high: "High",
  xhigh: "XHigh",
};

/** Chat service providers (catalog source). Only OpenCode Go for now. */
export const CHAT_PROVIDERS = [
  { id: "opencode-go", label: "OpenCode Go" },
] as const;

export type ChatProviderId = (typeof CHAT_PROVIDERS)[number]["id"];

const OFF_ONLY: ThinkingLevel[] = ["off"];
const DEEPSEEK_LEVELS: ThinkingLevel[] = [
  "off",
  "low",
  "medium",
  "high",
  "xhigh",
];
const KIMI_LEVELS: ThinkingLevel[] = ["off", "low", "medium", "high"];
const ANTHROPIC_THINKING: ThinkingLevel[] = ["off", "high", "xhigh"];

/**
 * Supported thinking UI levels per OpenCode Go model id.
 * Models missing from this map only allow Off (no thinking request).
 */
const MODEL_THINKING_LEVELS: Record<string, ThinkingLevel[]> = {
  "deepseek-v4-flash": DEEPSEEK_LEVELS,
  "deepseek-v4-pro": DEEPSEEK_LEVELS,
  "kimi-k2.7-code": KIMI_LEVELS,
  "kimi-k2.6": KIMI_LEVELS,
  "kimi-k3": DEEPSEEK_LEVELS,
  "minimax-m3": ANTHROPIC_THINKING,
  "minimax-m2.7": ANTHROPIC_THINKING,
  "minimax-m2.5": ANTHROPIC_THINKING,
  "qwen3.7-max": ANTHROPIC_THINKING,
  "qwen3.7-plus": ANTHROPIC_THINKING,
  "qwen3.6-plus": ANTHROPIC_THINKING,
};

function normalizeModelId(modelId: string): string {
  return modelId.trim().toLowerCase();
}

export function thinkingLevelsForModel(modelId: string): ThinkingLevel[] {
  const levels = MODEL_THINKING_LEVELS[normalizeModelId(modelId)];
  return levels?.length ? [...levels] : [...OFF_ONLY];
}

/** True when the model exposes thinking UI levels beyond Off-only. */
export function modelHasThinkingLevels(modelId: string): boolean {
  return thinkingLevelsForModel(modelId).some((level) => level !== "off");
}

/**
 * OpenAI-compatible Go models that accept `thinking: { type: "disabled" }`.
 * DeepSeek V4 and Kimi K2.6 default thinking on and require an explicit disable.
 * Kimi K3 / K2.7-code are always-on and reject (or ignore) disable.
 */
export function openaiCompatibleThinkingCanDisable(modelId: string): boolean {
  const id = normalizeModelId(modelId);
  if (!modelHasThinkingLevels(id)) return false;
  if (id.startsWith("kimi-k2.7")) return false;
  if (id === "kimi-k3" || id.startsWith("kimi-k3.")) return false;
  return true;
}

/**
 * DeepSeek-style OpenAI path: send `thinking` toggle together with
 * `reasoning_effort`. Kimi K2.x rejects combining both; K3 uses effort only.
 */
export function openaiCompatibleUsesThinkingWithEffort(modelId: string): boolean {
  return normalizeModelId(modelId).startsWith("deepseek");
}

export function isThinkingLevel(
  value: string | null | undefined,
): value is ThinkingLevel {
  return (
    value === "off" ||
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "xhigh"
  );
}

/** Snap to a level the model supports (prefer Off, else first available). */
export function coerceThinkingLevel(
  modelId: string,
  preferred: ThinkingLevel,
): ThinkingLevel {
  const allowed = thinkingLevelsForModel(modelId);
  if (allowed.includes(preferred)) return preferred;
  if (allowed.includes("off")) return "off";
  return allowed[0] ?? "off";
}

/**
 * Map UI thinking level → OpenAI-compatible `reasoning_effort`.
 * DeepSeek accepts high/max; low/medium map to high upstream, xhigh → max.
 */
export function reasoningEffortForLevel(
  level: ThinkingLevel,
): string | undefined {
  if (level === "off") return undefined;
  if (level === "xhigh") return "max";
  return level;
}

/** Anthropic-style thinking budget tokens for MiniMax / Qwen on Go. */
export function anthropicThinkingBudget(level: ThinkingLevel): number | undefined {
  switch (level) {
    case "off":
      return undefined;
    case "low":
      return 2_048;
    case "medium":
      return 8_192;
    case "high":
      return 16_384;
    case "xhigh":
      return 32_768;
  }
}

export function isChatProviderId(value: string): value is ChatProviderId {
  return CHAT_PROVIDERS.some((p) => p.id === value);
}

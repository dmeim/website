import type { GoModelInfo, ProviderKind } from "./types";
import { thinkingLevelsForModel } from "./thinking";

/** Models that use the Anthropic-compatible `/messages` endpoint. */
const ANTHROPIC_MODEL_IDS = new Set([
  "minimax-m3",
  "minimax-m2.7",
  "minimax-m2.5",
  "qwen3.7-max",
  "qwen3.7-plus",
  "qwen3.6-plus",
]);

/**
 * Resolve OpenCode Go provider kind for a model id.
 * Prefer metadata from `/v1/models` when available; fall back to known mapping.
 */
export function providerKindForModelId(
  modelId: string,
  catalogProvider?: ProviderKind | string | null,
): ProviderKind {
  if (catalogProvider === "anthropic" || catalogProvider === "openai-compatible") {
    return catalogProvider;
  }
  const normalized = modelId.trim().toLowerCase();
  if (ANTHROPIC_MODEL_IDS.has(normalized)) return "anthropic";
  // Heuristic: qwen / minimax on Go docs use anthropic endpoint
  if (normalized.startsWith("qwen") || normalized.startsWith("minimax")) {
    return "anthropic";
  }
  return "openai-compatible";
}

function enrichModel(
  id: string,
  name: string,
  provider: ProviderKind,
): GoModelInfo {
  return {
    id,
    name,
    provider,
    chatProvider: "opencode-go",
    thinkingLevels: thinkingLevelsForModel(id),
  };
}

/** Static fallback when live `/v1/models` fetch fails. */
export const FALLBACK_GO_MODELS: GoModelInfo[] = [
  enrichModel("deepseek-v4-flash", "DeepSeek V4 Flash", "openai-compatible"),
  enrichModel("deepseek-v4-pro", "DeepSeek V4 Pro", "openai-compatible"),
  enrichModel("kimi-k2.7-code", "Kimi K2.7 Code", "openai-compatible"),
  enrichModel("kimi-k2.6", "Kimi K2.6", "openai-compatible"),
  enrichModel("kimi-k3", "Kimi K3", "openai-compatible"),
  enrichModel("glm-5.2", "GLM-5.2", "openai-compatible"),
  enrichModel("glm-5.1", "GLM-5.1", "openai-compatible"),
  enrichModel("grok-4.5", "Grok 4.5", "openai-compatible"),
  enrichModel("mimo-v2.5", "MiMo-V2.5", "openai-compatible"),
  enrichModel("mimo-v2.5-pro", "MiMo-V2.5-Pro", "openai-compatible"),
  enrichModel("hy3", "Hy3", "openai-compatible"),
  enrichModel("minimax-m3", "MiniMax M3", "anthropic"),
  enrichModel("minimax-m2.7", "MiniMax M2.7", "anthropic"),
  enrichModel("minimax-m2.5", "MiniMax M2.5", "anthropic"),
  enrichModel("qwen3.7-max", "Qwen3.7 Max", "anthropic"),
  enrichModel("qwen3.7-plus", "Qwen3.7 Plus", "anthropic"),
  enrichModel("qwen3.6-plus", "Qwen3.6 Plus", "anthropic"),
];

interface RawGoModel {
  id?: string;
  name?: string;
  object?: string;
  owned_by?: string;
  /** Some catalogs expose API family hints. */
  api?: string;
  endpoint?: string;
  provider?: string;
}

function inferProviderFromRaw(raw: RawGoModel, id: string): ProviderKind {
  const hint = (raw.api ?? raw.endpoint ?? raw.provider ?? "").toLowerCase();
  if (hint.includes("anthropic") || hint.includes("messages")) {
    return "anthropic";
  }
  if (hint.includes("openai") || hint.includes("chat/completions")) {
    return "openai-compatible";
  }
  return providerKindForModelId(id);
}

/**
 * Normalize OpenCode Go `/v1/models` JSON into a stable catalog.
 * Accepts `{ data: [...] }` (OpenAI-style) or a bare array.
 */
export function normalizeGoModelsPayload(payload: unknown): GoModelInfo[] {
  const list: RawGoModel[] = Array.isArray(payload)
    ? (payload as RawGoModel[])
    : Array.isArray((payload as { data?: unknown })?.data)
      ? ((payload as { data: RawGoModel[] }).data)
      : [];

  const seen = new Set<string>();
  const out: GoModelInfo[] = [];

  for (const raw of list) {
    const id = typeof raw.id === "string" ? raw.id.trim() : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const name =
      typeof raw.name === "string" && raw.name.trim()
        ? raw.name.trim()
        : id;
    out.push(enrichModel(id, name, inferProviderFromRaw(raw, id)));
  }

  return out.length > 0 ? out : [...FALLBACK_GO_MODELS];
}

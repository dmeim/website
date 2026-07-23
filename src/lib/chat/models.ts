import type { GoModelInfo, ProviderKind } from "./types";

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

/** Static fallback when live `/v1/models` fetch fails. */
export const FALLBACK_GO_MODELS: GoModelInfo[] = [
  { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", provider: "openai-compatible" },
  { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", provider: "openai-compatible" },
  { id: "kimi-k2.7-code", name: "Kimi K2.7 Code", provider: "openai-compatible" },
  { id: "kimi-k2.6", name: "Kimi K2.6", provider: "openai-compatible" },
  { id: "kimi-k3", name: "Kimi K3", provider: "openai-compatible" },
  { id: "glm-5.2", name: "GLM-5.2", provider: "openai-compatible" },
  { id: "glm-5.1", name: "GLM-5.1", provider: "openai-compatible" },
  { id: "grok-4.5", name: "Grok 4.5", provider: "openai-compatible" },
  { id: "mimo-v2.5", name: "MiMo-V2.5", provider: "openai-compatible" },
  { id: "mimo-v2.5-pro", name: "MiMo-V2.5-Pro", provider: "openai-compatible" },
  { id: "hy3", name: "Hy3", provider: "openai-compatible" },
  { id: "minimax-m3", name: "MiniMax M3", provider: "anthropic" },
  { id: "minimax-m2.7", name: "MiniMax M2.7", provider: "anthropic" },
  { id: "minimax-m2.5", name: "MiniMax M2.5", provider: "anthropic" },
  { id: "qwen3.7-max", name: "Qwen3.7 Max", provider: "anthropic" },
  { id: "qwen3.7-plus", name: "Qwen3.7 Plus", provider: "anthropic" },
  { id: "qwen3.6-plus", name: "Qwen3.6 Plus", provider: "anthropic" },
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
    out.push({
      id,
      name,
      provider: inferProviderFromRaw(raw, id),
    });
  }

  return out.length > 0 ? out : [...FALLBACK_GO_MODELS];
}

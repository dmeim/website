import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { OPENCODE_GO_BASE } from "./constants";
import { providerKindForModelId } from "./models";
import type { ProviderKind } from "./types";

/**
 * Build an OpenCode Go language model for the given model id.
 * Anthropic-endpoint models use Bearer auth via `authToken`.
 */
export function createGoLanguageModel(
  modelId: string,
  apiKey: string,
  catalogProvider?: ProviderKind | string | null,
): LanguageModel {
  const kind = providerKindForModelId(modelId, catalogProvider);

  if (kind === "anthropic") {
    const anthropic = createAnthropic({
      baseURL: OPENCODE_GO_BASE,
      authToken: apiKey,
      name: "opencode-go",
    });
    return anthropic(modelId);
  }

  const openai = createOpenAICompatible({
    name: "opencode-go",
    baseURL: OPENCODE_GO_BASE,
    apiKey,
  });
  return openai(modelId);
}

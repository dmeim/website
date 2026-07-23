import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { SharedV4ProviderOptions } from "@ai-sdk/provider";
import type { LanguageModel } from "ai";
import { OPENCODE_GO_BASE } from "./constants";
import { providerKindForModelId } from "./models";
import {
  anthropicThinkingBudget,
  coerceThinkingLevel,
  modelHasThinkingLevels,
  openaiCompatibleThinkingCanDisable,
  openaiCompatibleUsesThinkingWithEffort,
  reasoningEffortForLevel,
} from "./thinking";
import type { ProviderKind, ThinkingLevel } from "./types";

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

/**
 * Provider option bag for streamText based on model + thinking UI level.
 *
 * Off must be explicit for families that default thinking on (DeepSeek V4,
 * Kimi K2.6, Qwen/MiniMax Anthropic hybrids). Omitting options leaves thinking
 * enabled upstream.
 */
export function goThinkingProviderOptions(
  modelId: string,
  thinkingLevel: ThinkingLevel,
  catalogProvider?: ProviderKind | string | null,
): SharedV4ProviderOptions | undefined {
  const level = coerceThinkingLevel(modelId, thinkingLevel);
  const kind = providerKindForModelId(modelId, catalogProvider);

  if (kind === "anthropic") {
    if (level === "off") {
      if (!modelHasThinkingLevels(modelId)) return undefined;
      return {
        "opencode-go": {
          thinking: { type: "disabled" },
        },
      };
    }

    const budget = anthropicThinkingBudget(level);
    if (budget == null) return undefined;
    return {
      "opencode-go": {
        thinking: { type: "enabled", budgetTokens: budget },
      },
    };
  }

  if (level === "off") {
    if (!openaiCompatibleThinkingCanDisable(modelId)) return undefined;
    return {
      "opencode-go": {
        thinking: { type: "disabled" },
      },
    };
  }

  const effort = reasoningEffortForLevel(level);
  if (!effort) return undefined;

  if (openaiCompatibleUsesThinkingWithEffort(modelId)) {
    return {
      "opencode-go": {
        thinking: { type: "enabled" },
        reasoningEffort: effort,
      },
    };
  }

  return {
    "opencode-go": {
      reasoningEffort: effort,
    },
  };
}

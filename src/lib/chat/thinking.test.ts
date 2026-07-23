import { describe, expect, it } from "vitest";
import {
  coerceThinkingLevel,
  modelHasThinkingLevels,
  openaiCompatibleThinkingCanDisable,
  openaiCompatibleUsesThinkingWithEffort,
  reasoningEffortForLevel,
  thinkingLevelsForModel,
} from "./thinking";
import { goThinkingProviderOptions } from "./provider";

describe("thinkingLevelsForModel", () => {
  it("exposes DeepSeek full ladder", () => {
    expect(thinkingLevelsForModel("deepseek-v4-flash")).toEqual([
      "off",
      "low",
      "medium",
      "high",
      "xhigh",
    ]);
  });

  it("defaults unknown models to Off only", () => {
    expect(thinkingLevelsForModel("glm-5.2")).toEqual(["off"]);
  });
});

describe("coerceThinkingLevel", () => {
  it("keeps allowed levels", () => {
    expect(coerceThinkingLevel("deepseek-v4-pro", "high")).toBe("high");
  });

  it("falls back to off when unsupported", () => {
    expect(coerceThinkingLevel("glm-5.2", "high")).toBe("off");
  });
});

describe("reasoningEffortForLevel", () => {
  it("omits off and maps xhigh to max", () => {
    expect(reasoningEffortForLevel("off")).toBeUndefined();
    expect(reasoningEffortForLevel("xhigh")).toBe("max");
    expect(reasoningEffortForLevel("medium")).toBe("medium");
  });
});

describe("thinking family helpers", () => {
  it("detects models with thinking controls", () => {
    expect(modelHasThinkingLevels("deepseek-v4-flash")).toBe(true);
    expect(modelHasThinkingLevels("qwen3.7-plus")).toBe(true);
    expect(modelHasThinkingLevels("glm-5.2")).toBe(false);
  });

  it("allows disable for DeepSeek and Kimi K2.6, not always-on Kimi", () => {
    expect(openaiCompatibleThinkingCanDisable("deepseek-v4-pro")).toBe(true);
    expect(openaiCompatibleThinkingCanDisable("kimi-k2.6")).toBe(true);
    expect(openaiCompatibleThinkingCanDisable("kimi-k2.7-code")).toBe(false);
    expect(openaiCompatibleThinkingCanDisable("kimi-k3")).toBe(false);
    expect(openaiCompatibleThinkingCanDisable("glm-5.2")).toBe(false);
  });

  it("pairs thinking toggle with effort only for DeepSeek", () => {
    expect(openaiCompatibleUsesThinkingWithEffort("deepseek-v4-flash")).toBe(
      true,
    );
    expect(openaiCompatibleUsesThinkingWithEffort("kimi-k2.6")).toBe(false);
    expect(openaiCompatibleUsesThinkingWithEffort("kimi-k3")).toBe(false);
  });
});

describe("goThinkingProviderOptions", () => {
  it("explicitly disables thinking for DeepSeek when Off", () => {
    expect(goThinkingProviderOptions("deepseek-v4-flash", "off")).toEqual({
      "opencode-go": { thinking: { type: "disabled" } },
    });
  });

  it("explicitly disables thinking for Kimi K2.6 when Off", () => {
    expect(goThinkingProviderOptions("kimi-k2.6", "off")).toEqual({
      "opencode-go": { thinking: { type: "disabled" } },
    });
  });

  it("omits options for always-on Kimi models when Off", () => {
    expect(goThinkingProviderOptions("kimi-k2.7-code", "off")).toBeUndefined();
    expect(goThinkingProviderOptions("kimi-k3", "off")).toBeUndefined();
  });

  it("omits options for Off-only models", () => {
    expect(goThinkingProviderOptions("glm-5.2", "off")).toBeUndefined();
  });

  it("sends thinking enabled + reasoningEffort for DeepSeek when On", () => {
    expect(goThinkingProviderOptions("deepseek-v4-flash", "high")).toEqual({
      "opencode-go": {
        thinking: { type: "enabled" },
        reasoningEffort: "high",
      },
    });
    expect(goThinkingProviderOptions("deepseek-v4-pro", "xhigh")).toEqual({
      "opencode-go": {
        thinking: { type: "enabled" },
        reasoningEffort: "max",
      },
    });
  });

  it("sends reasoningEffort only for non-DeepSeek openai models when On", () => {
    expect(goThinkingProviderOptions("kimi-k3", "high")).toEqual({
      "opencode-go": { reasoningEffort: "high" },
    });
  });

  it("explicitly disables thinking for anthropic-endpoint models when Off", () => {
    expect(goThinkingProviderOptions("minimax-m2.7", "off")).toEqual({
      "opencode-go": { thinking: { type: "disabled" } },
    });
    expect(goThinkingProviderOptions("qwen3.7-plus", "off")).toEqual({
      "opencode-go": { thinking: { type: "disabled" } },
    });
  });

  it("sends thinking budget for anthropic-endpoint models when On", () => {
    expect(goThinkingProviderOptions("minimax-m2.7", "high")).toEqual({
      "opencode-go": {
        thinking: { type: "enabled", budgetTokens: 16_384 },
      },
    });
    expect(goThinkingProviderOptions("qwen3.7-max", "xhigh")).toEqual({
      "opencode-go": {
        thinking: { type: "enabled", budgetTokens: 32_768 },
      },
    });
  });
});

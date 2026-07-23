import { describe, expect, it } from "vitest";
import {
  coerceThinkingLevel,
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

describe("goThinkingProviderOptions", () => {
  it("returns undefined when thinking is off", () => {
    expect(goThinkingProviderOptions("deepseek-v4-flash", "off")).toBeUndefined();
  });

  it("sends reasoningEffort for openai-compatible models", () => {
    expect(goThinkingProviderOptions("deepseek-v4-flash", "high")).toEqual({
      "opencode-go": { reasoningEffort: "high" },
    });
  });

  it("sends thinking budget for anthropic-endpoint models", () => {
    expect(goThinkingProviderOptions("minimax-m2.7", "high")).toEqual({
      "opencode-go": {
        thinking: { type: "enabled", budgetTokens: 16_384 },
      },
    });
  });
});

import { describe, expect, it } from "vitest";
import { assistantContentToPersist } from "./persist-assistant";

describe("assistantContentToPersist", () => {
  it("persists trimmed finish text", () => {
    expect(assistantContentToPersist({ text: "  hello world  " })).toEqual({
      content: "hello world",
      reasoning: null,
    });
  });

  it("skips empty finish text", () => {
    expect(assistantContentToPersist({ text: "   " })).toBeNull();
    expect(assistantContentToPersist({ text: "" })).toBeNull();
    expect(assistantContentToPersist({ text: null })).toBeNull();
  });

  it("joins abort step text for partials", () => {
    expect(
      assistantContentToPersist({
        steps: [{ text: "Hello" }, { text: " world" }],
      }),
    ).toEqual({ content: "Hello world", reasoning: null });
  });

  it("skips empty abort steps", () => {
    expect(assistantContentToPersist({ steps: [{ text: "  " }] })).toBeNull();
    expect(assistantContentToPersist({ steps: [] })).toBeNull();
  });

  it("persists reasoning with answer text", () => {
    expect(
      assistantContentToPersist({
        text: "Answer",
        reasoningText: "  chain of thought  ",
      }),
    ).toEqual({ content: "Answer", reasoning: "chain of thought" });
  });

  it("persists reasoning alone when answer empty", () => {
    expect(
      assistantContentToPersist({
        text: "   ",
        reasoningText: "still thinking",
      }),
    ).toEqual({ content: "", reasoning: "still thinking" });
  });

  it("prefers joining steps over final-step-only text (onEnd payload)", () => {
    expect(
      assistantContentToPersist({
        text: "final only",
        reasoningText: "final reason",
        steps: [
          { text: "part A ", reasoningText: "think A " },
          { text: "part B", reasoningText: "think B" },
        ],
      }),
    ).toEqual({ content: "part A part B", reasoning: "think A think B" });
  });

  it("falls back to text when steps is empty", () => {
    expect(
      assistantContentToPersist({
        text: "solo",
        reasoningText: "r",
        steps: [],
      }),
    ).toEqual({ content: "solo", reasoning: "r" });
  });
});

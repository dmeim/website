import { describe, expect, it } from "vitest";
import { assistantContentToPersist } from "./persist-assistant";

describe("assistantContentToPersist", () => {
  it("persists trimmed finish text", () => {
    expect(assistantContentToPersist({ text: "  hello world  " })).toBe(
      "hello world",
    );
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
    ).toBe("Hello world");
  });

  it("skips empty abort steps", () => {
    expect(assistantContentToPersist({ steps: [{ text: "  " }] })).toBeNull();
    expect(assistantContentToPersist({ steps: [] })).toBeNull();
  });
});

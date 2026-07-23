import { describe, expect, it } from "vitest";
import { truncateMessagesForContext } from "./context-window";

describe("truncateMessagesForContext", () => {
  it("returns all messages when under the limit", () => {
    const messages = [
      { role: "user", id: "1" },
      { role: "assistant", id: "2" },
    ];
    expect(truncateMessagesForContext(messages, 40)).toEqual({
      messages,
      truncated: false,
    });
  });

  it("keeps recent turns and prefers starting on a user message", () => {
    const messages = [
      { role: "user", id: "u1" },
      { role: "assistant", id: "a1" },
      { role: "user", id: "u2" },
      { role: "assistant", id: "a2" },
      { role: "user", id: "u3" },
      { role: "assistant", id: "a3" },
    ];
    // start = 6-3 = 3 → a2; advance to next user → u3 → [u3, a3]
    const result = truncateMessagesForContext(messages, 3);
    expect(result.truncated).toBe(true);
    expect(result.messages.map((m) => m.id)).toEqual(["u3", "a3"]);
  });

  it("falls back when no user turn exists in the window", () => {
    const messages = [
      { role: "assistant", id: "a1" },
      { role: "assistant", id: "a2" },
      { role: "assistant", id: "a3" },
    ];
    const result = truncateMessagesForContext(messages, 2);
    expect(result.truncated).toBe(true);
    expect(result.messages.map((m) => m.id)).toEqual(["a2", "a3"]);
  });
});

import { describe, expect, it } from "vitest";
import { forkChatTitle, planForkMessages } from "./fork";
import type { ChatMessageDto } from "./types";

const msgs = (
  rows: Array<Pick<ChatMessageDto, "id" | "role" | "content">>,
): ChatMessageDto[] =>
  rows.map((r, i) => ({
    id: r.id,
    role: r.role,
    content: r.content,
    reasoning: null,
    createdAt: "t",
    seq: i + 1,
    attachments: [],
  }));

describe("planForkMessages", () => {
  const history = msgs([
    { id: "u1", role: "user", content: "one" },
    { id: "a1", role: "assistant", content: "ok" },
    { id: "u2", role: "user", content: "two" },
    { id: "a2", role: "assistant", content: "done" },
  ]);

  it("copies full history when no pivot", () => {
    const plan = planForkMessages(history);
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.copy.map((m) => m.id)).toEqual(["u1", "a1", "u2", "a2"]);
    expect(plan.editedUser).toBeNull();
    expect(plan.forkedFromMessageId).toBeNull();
  });

  it("copies through a pivot inclusively", () => {
    const plan = planForkMessages(history, { throughMessageId: "a1" });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.copy.map((m) => m.id)).toEqual(["u1", "a1"]);
    expect(plan.forkedFromMessageId).toBe("a1");
  });

  it("plans an edit branch before the user message", () => {
    const plan = planForkMessages(history, {
      throughMessageId: "u2",
      editContent: "two edited",
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.copy.map((m) => m.id)).toEqual(["u1", "a1"]);
    expect(plan.editedUser?.content).toBe("two edited");
    expect(plan.editedUser?.source.id).toBe("u2");
    expect(plan.forkedFromMessageId).toBe("u2");
  });

  it("rejects editing a non-user message", () => {
    const plan = planForkMessages(history, {
      throughMessageId: "a1",
      editContent: "nope",
    });
    expect(plan).toEqual({
      ok: false,
      error: "Only user messages can be edited",
    });
  });

  it("rejects unknown pivot", () => {
    const plan = planForkMessages(history, { throughMessageId: "missing" });
    expect(plan.ok).toBe(false);
  });
});

describe("forkChatTitle", () => {
  it("appends fork or edit suffix", () => {
    expect(forkChatTitle("Hello", false)).toBe("Hello (fork)");
    expect(forkChatTitle("Hello", true)).toBe("Hello (edit)");
  });
});

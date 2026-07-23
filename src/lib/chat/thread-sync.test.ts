import { describe, expect, it } from "vitest";
import {
  isHollowAssistant,
  shouldPreferLocalThread,
  type ChatUiMessage,
} from "@/components/chat/messageUtils";

function msg(
  role: "user" | "assistant",
  text = "",
  id = "m-" + role + "-" + text,
): ChatUiMessage {
  return {
    id,
    role,
    parts: text ? [{ type: "text", text }] : [],
  };
}

describe("shouldPreferLocalThread", () => {
  it("keeps local when server ends on user but local has assistant", () => {
    const local = [msg("user", "hi"), msg("assistant", "hello")];
    const server = [msg("user", "hi")];
    expect(shouldPreferLocalThread(local, server)).toBe(true);
  });

  it("keeps local when server is shorter and local ends with assistant", () => {
    const local = [
      msg("user", "a"),
      msg("assistant", "b"),
      msg("user", "c"),
      msg("assistant", "d"),
    ];
    const server = [msg("user", "a"), msg("assistant", "b"), msg("user", "c")];
    expect(shouldPreferLocalThread(local, server)).toBe(true);
  });

  it("allows overwrite when server has caught up with assistant", () => {
    const local = [msg("user", "hi"), msg("assistant", "partial")];
    const server = [msg("user", "hi"), msg("assistant", "full reply")];
    expect(shouldPreferLocalThread(local, server)).toBe(false);
  });

  it("allows overwrite when both end on user", () => {
    const local = [msg("user", "hi")];
    const server = [msg("user", "hi")];
    expect(shouldPreferLocalThread(local, server)).toBe(false);
  });

  it("does not prefer empty local", () => {
    expect(shouldPreferLocalThread([], [msg("user", "hi")])).toBe(false);
  });
});

describe("isHollowAssistant", () => {
  it("detects empty assistant placeholder", () => {
    expect(isHollowAssistant(msg("assistant"))).toBe(true);
  });

  it("is false for assistant with text", () => {
    expect(isHollowAssistant(msg("assistant", "hi"))).toBe(false);
  });

  it("is false for user messages", () => {
    expect(isHollowAssistant(msg("user"))).toBe(false);
  });
});

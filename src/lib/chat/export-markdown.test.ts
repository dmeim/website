import { describe, expect, it } from "vitest";
import { chatToMarkdownExport } from "./export-markdown";
import type { ChatMessageDto, ChatSummary } from "./types";

describe("chatToMarkdownExport", () => {
  it("renders a titled markdown transcript", () => {
    const chat: ChatSummary = {
      id: "c1",
      title: "Hello world",
      modelId: "deepseek-v4-flash",
      archivedAt: null,
      generatingAt: null,
      lastError: null,
      forkedFromChatId: null,
      forkedFromMessageId: null,
      createdAt: "2026-07-22T10:00:00.000Z",
      updatedAt: "2026-07-22T11:00:00.000Z",
    };
    const messages: ChatMessageDto[] = [
      {
        id: "m1",
        role: "user",
        content: "Hi",
        createdAt: "2026-07-22T10:00:00.000Z",
        seq: 1,
        attachments: [],
      },
      {
        id: "m2",
        role: "assistant",
        content: "Hello!",
        createdAt: "2026-07-22T10:00:01.000Z",
        seq: 2,
        attachments: [],
      },
    ];
    const md = chatToMarkdownExport(chat, messages, "2026-07-22T12:00:00.000Z");
    expect(md).toContain("# Hello world");
    expect(md).toContain("## You");
    expect(md).toContain("Hi");
    expect(md).toContain("## Assistant");
    expect(md).toContain("Hello!");
    expect(md).toContain("deepseek-v4-flash");
  });
});

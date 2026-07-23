import { describe, expect, it } from "vitest";
import { buildModelMessages } from "./build-model-messages";
import type { ChatMessageDto } from "./types";

describe("buildModelMessages", () => {
  it("keeps plain text turns", async () => {
    const history: ChatMessageDto[] = [
      {
        id: "1",
        role: "user",
        content: "Hello",
        reasoning: null,
        createdAt: "t",
        seq: 1,
        attachments: [],
      },
      {
        id: "2",
        role: "assistant",
        content: "Hi",
        reasoning: null,
        createdAt: "t",
        seq: 2,
        attachments: [],
      },
    ];
    const { messages } = await buildModelMessages(history);
    expect(messages).toEqual([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi" },
    ]);
  });

  it("inlines image attachments when loader returns bytes", async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const history: ChatMessageDto[] = [
      {
        id: "1",
        role: "user",
        content: "Describe",
        reasoning: null,
        createdAt: "t",
        seq: 1,
        attachments: [
          {
            id: "att1",
            libraryAssetId: "a1",
            filename: "pic.png",
            contentType: "image/png",
            kind: "image",
            byteSize: 3,
          },
        ],
      },
    ];
    const { messages, multimodalNotes } = await buildModelMessages(
      history,
      async () => bytes,
    );
    expect(multimodalNotes).toContain("image:pic.png");
    expect(messages[0]?.role).toBe("user");
    const content = messages[0]?.content;
    expect(Array.isArray(content)).toBe(true);
    if (Array.isArray(content)) {
      expect(content.some((p) => p.type === "image")).toBe(true);
      expect(content.some((p) => p.type === "text")).toBe(true);
    }
  });

  it("extracts text-like attachments into the prompt", async () => {
    const history: ChatMessageDto[] = [
      {
        id: "1",
        role: "user",
        content: "Summarize",
        reasoning: null,
        createdAt: "t",
        seq: 1,
        attachments: [
          {
            id: "att1",
            libraryAssetId: "a1",
            filename: "note.txt",
            contentType: "text/plain",
            kind: "other",
            byteSize: 11,
          },
        ],
      },
    ];
    const { messages, multimodalNotes } = await buildModelMessages(
      history,
      async () => new TextEncoder().encode("hello world"),
    );
    expect(multimodalNotes.some((n) => n.startsWith("text:"))).toBe(true);
    expect(messages[0]).toEqual({
      role: "user",
      content: expect.stringContaining("hello world"),
    });
  });

  it("notes video attachments without failing", async () => {
    const history: ChatMessageDto[] = [
      {
        id: "1",
        role: "user",
        content: "See clip",
        reasoning: null,
        createdAt: "t",
        seq: 1,
        attachments: [
          {
            id: "att1",
            libraryAssetId: "a1",
            filename: "clip.mp4",
            contentType: "video/mp4",
            kind: "video",
            byteSize: 100,
          },
        ],
      },
    ];
    const { messages, multimodalNotes } = await buildModelMessages(
      history,
      async () => null,
    );
    expect(multimodalNotes).toContain("degraded:clip.mp4");
    expect(messages[0]).toEqual({
      role: "user",
      content: expect.stringContaining("Video"),
    });
  });
});

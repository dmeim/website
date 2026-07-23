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
        createdAt: "t",
        seq: 1,
        attachments: [],
      },
      {
        id: "2",
        role: "assistant",
        content: "Hi",
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

  it("notes non-image attachments as text only", async () => {
    const history: ChatMessageDto[] = [
      {
        id: "1",
        role: "user",
        content: "See PDF",
        createdAt: "t",
        seq: 1,
        attachments: [
          {
            id: "att1",
            libraryAssetId: "a1",
            filename: "doc.pdf",
            contentType: "application/pdf",
            kind: "pdf",
            byteSize: 100,
          },
        ],
      },
    ];
    const { messages } = await buildModelMessages(history, async () => null);
    expect(messages[0]).toEqual({
      role: "user",
      content: expect.stringContaining("doc.pdf"),
    });
  });
});

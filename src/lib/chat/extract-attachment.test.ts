import { describe, expect, it } from "vitest";
import { isTextLikeMime } from "./extract-attachment";
import { resolveAttachmentForModel } from "./extract-attachment";
import type { MessageAttachmentSummary } from "./types";

describe("isTextLikeMime", () => {
  it("accepts text and json", () => {
    expect(isTextLikeMime("text/plain")).toBe(true);
    expect(isTextLikeMime("application/json")).toBe(true);
    expect(isTextLikeMime("application/octet-stream", "notes.md")).toBe(true);
  });

  it("rejects video", () => {
    expect(isTextLikeMime("video/mp4", "clip.mp4")).toBe(false);
  });
});

describe("resolveAttachmentForModel", () => {
  const base = (
    partial: Partial<MessageAttachmentSummary>,
  ): MessageAttachmentSummary => ({
    id: "att",
    libraryAssetId: "a1",
    filename: "file.bin",
    contentType: "application/octet-stream",
    kind: "other",
    byteSize: 10,
    ...partial,
  });

  it("inlines small images", async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const result = await resolveAttachmentForModel(
      base({
        filename: "pic.png",
        contentType: "image/png",
        kind: "image",
        byteSize: 3,
      }),
      async () => bytes,
      { imageMaxBytes: 100 },
    );
    expect(result.kind).toBe("image");
  });

  it("extracts text-like files", async () => {
    const text = "hello world";
    const result = await resolveAttachmentForModel(
      base({
        filename: "note.txt",
        contentType: "text/plain",
        kind: "other",
        byteSize: text.length,
      }),
      async () => new TextEncoder().encode(text),
      { imageMaxBytes: 100 },
    );
    expect(result.kind).toBe("text");
    if (result.kind === "text") {
      expect(result.text).toContain("hello world");
    }
  });

  it("degrades video to a note", async () => {
    const result = await resolveAttachmentForModel(
      base({
        filename: "clip.mp4",
        contentType: "video/mp4",
        kind: "video",
        byteSize: 999,
      }),
      async () => null,
      { imageMaxBytes: 100 },
    );
    expect(result.kind).toBe("note");
    if (result.kind === "note") {
      expect(result.note).toContain("Video");
    }
  });
});

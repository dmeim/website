import type { ModelMessage } from "ai";
import type { ChatMessageDto, MessageAttachmentSummary } from "./types";

/** Soft cap for inline image bytes sent to the model (~4 MiB). */
export const MODEL_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

export type AssetBytesLoader = (
  attachment: MessageAttachmentSummary,
) => Promise<Uint8Array | null>;

function textWithAttachmentNote(
  content: string,
  attachmentNames: string[],
  extraNotes: string[] = [],
): string {
  const parts: string[] = [];
  if (content.trim()) parts.push(content.trim());
  if (attachmentNames.length > 0) {
    parts.push(`[Attached: ${attachmentNames.join(", ")}]`);
  }
  for (const note of extraNotes) {
    if (note.trim()) parts.push(note.trim());
  }
  return parts.join("\n\n");
}

/**
 * Convert persisted chat messages into AI SDK ModelMessages.
 * Image attachments are inlined when loader returns bytes; otherwise a text note.
 */
export async function buildModelMessages(
  history: ChatMessageDto[],
  loadAssetBytes?: AssetBytesLoader,
): Promise<{ messages: ModelMessage[]; multimodalNotes: string[] }> {
  const multimodalNotes: string[] = [];
  const messages: ModelMessage[] = [];

  for (const m of history) {
    if (m.role !== "user" && m.role !== "assistant" && m.role !== "system") {
      continue;
    }

    if (m.role === "assistant" || m.role === "system") {
      messages.push({
        role: m.role,
        content: textWithAttachmentNote(
          m.content,
          m.attachments.map((a) => a.filename),
        ),
      });
      continue;
    }

    const attachmentNames = m.attachments.map((a) => a.filename);
    const imageParts: Array<{
      type: "image";
      image: Uint8Array;
      mediaType?: string;
    }> = [];
    const skipNotes: string[] = [];

    if (loadAssetBytes) {
      for (const a of m.attachments) {
        if (a.kind !== "image") {
          skipNotes.push(
            `[Attachment “${a.filename}” noted as text only — not an image for the model.]`,
          );
          continue;
        }
        if (a.byteSize > MODEL_IMAGE_MAX_BYTES) {
          skipNotes.push(
            `[Image “${a.filename}” skipped for the model (too large; kept as filename note).]`,
          );
          multimodalNotes.push(`skipped-large:${a.filename}`);
          continue;
        }
        const bytes = await loadAssetBytes(a);
        if (!bytes) {
          skipNotes.push(
            `[Image “${a.filename}” could not be loaded for the model.]`,
          );
          multimodalNotes.push(`missing:${a.filename}`);
          continue;
        }
        imageParts.push({
          type: "image",
          image: bytes,
          mediaType: a.contentType || undefined,
        });
        multimodalNotes.push(`image:${a.filename}`);
      }
    }

    const text = textWithAttachmentNote(m.content, attachmentNames, skipNotes);

    if (imageParts.length === 0) {
      messages.push({ role: "user", content: text });
    } else {
      messages.push({
        role: "user",
        content: [{ type: "text", text }, ...imageParts],
      });
    }
  }

  return { messages, multimodalNotes };
}

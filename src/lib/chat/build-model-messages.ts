import type { ModelMessage } from "ai";
import { MODEL_IMAGE_MAX_BYTES } from "./constants";
import { resolveAttachmentForModel } from "./extract-attachment";
import type { ChatMessageDto, MessageAttachmentSummary } from "./types";

/** Soft cap for inline image bytes sent to the model (~4 MiB). */
export { MODEL_IMAGE_MAX_BYTES };

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
 * Images are inlined when possible; text/PDF content is extracted best-effort;
 * other binaries degrade to visible filename notes (never fail the whole chat).
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
    const textExtracts: string[] = [];
    const skipNotes: string[] = [];

    if (loadAssetBytes && m.attachments.length > 0) {
      for (const a of m.attachments) {
        const resolved = await resolveAttachmentForModel(
          a,
          () => loadAssetBytes(a),
          { imageMaxBytes: MODEL_IMAGE_MAX_BYTES },
        );
        if (resolved.kind === "image") {
          imageParts.push({
            type: "image",
            image: resolved.bytes,
            mediaType: resolved.mediaType,
          });
          multimodalNotes.push(resolved.note);
        } else if (resolved.kind === "text") {
          textExtracts.push(resolved.text);
          multimodalNotes.push(resolved.note);
        } else {
          skipNotes.push(resolved.note);
          multimodalNotes.push(`degraded:${a.filename}`);
        }
      }
    } else if (m.attachments.length > 0) {
      for (const a of m.attachments) {
        skipNotes.push(
          `[Attachment “${a.filename}” noted as text only — content not loaded for the model.]`,
        );
        multimodalNotes.push(`unloaded:${a.filename}`);
      }
    }

    const text = textWithAttachmentNote(m.content, attachmentNames, [
      ...textExtracts,
      ...skipNotes,
    ]);

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

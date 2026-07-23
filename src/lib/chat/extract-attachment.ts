/**
 * Best-effort attachment content extraction for model prompts.
 *
 * Limits (keep in sync with UI hints):
 * - Images: inlined as image parts when ≤ MODEL_IMAGE_MAX_BYTES (4 MiB)
 * - text/*, JSON, markdown-like: UTF-8 text up to MODEL_TEXT_ATTACHMENT_MAX_CHARS
 * - PDF: unpdf text extract when ≤ MODEL_PDF_EXTRACT_MAX_BYTES; else filename note
 * - Video / other binary: filename + type + size note only (no bytes to model)
 */

import { extractText } from "unpdf";
import {
  MODEL_PDF_EXTRACT_MAX_BYTES,
  MODEL_TEXT_ATTACHMENT_MAX_BYTES,
  MODEL_TEXT_ATTACHMENT_MAX_CHARS,
} from "./constants";
import type { MessageAttachmentSummary } from "./types";

export type AttachmentModelPayload =
  | { kind: "image"; bytes: Uint8Array; mediaType?: string; note: string }
  | { kind: "text"; text: string; note: string }
  | { kind: "note"; note: string };

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KiB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MiB`;
}

export function isTextLikeMime(contentType: string, filename = ""): boolean {
  const mime = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (mime.startsWith("text/")) return true;
  if (
    mime === "application/json" ||
    mime === "application/xml" ||
    mime === "application/javascript" ||
    mime === "application/typescript" ||
    mime.endsWith("+json") ||
    mime.endsWith("+xml")
  ) {
    return true;
  }
  const lower = filename.toLowerCase();
  return (
    lower.endsWith(".md") ||
    lower.endsWith(".markdown") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".tsv") ||
    lower.endsWith(".json") ||
    lower.endsWith(".jsonc") ||
    lower.endsWith(".yaml") ||
    lower.endsWith(".yml") ||
    lower.endsWith(".toml") ||
    lower.endsWith(".xml") ||
    lower.endsWith(".html") ||
    lower.endsWith(".htm") ||
    lower.endsWith(".css") ||
    lower.endsWith(".js") ||
    lower.endsWith(".ts") ||
    lower.endsWith(".tsx") ||
    lower.endsWith(".jsx") ||
    lower.endsWith(".py") ||
    lower.endsWith(".rs") ||
    lower.endsWith(".go") ||
    lower.endsWith(".sql") ||
    lower.endsWith(".sh")
  );
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function truncateText(text: string, maxChars: number): {
  text: string;
  truncated: boolean;
} {
  if (text.length <= maxChars) return { text, truncated: false };
  return {
    text: `${text.slice(0, maxChars)}\n\n[…truncated for model context…]`,
    truncated: true,
  };
}

async function extractPdfText(bytes: Uint8Array): Promise<string | null> {
  try {
    const result = await extractText(bytes, { mergePages: true });
    const text = typeof result.text === "string" ? result.text : "";
    const trimmed = text.replace(/\u0000/g, "").trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

/**
 * Resolve one library attachment into model-usable content or a degradation note.
 * Never throws — always degrades gracefully.
 */
export async function resolveAttachmentForModel(
  attachment: MessageAttachmentSummary,
  loadBytes: () => Promise<Uint8Array | null>,
  opts: { imageMaxBytes: number },
): Promise<AttachmentModelPayload> {
  const label = attachment.filename;
  const meta = `${attachment.contentType || "unknown"}, ${formatBytes(attachment.byteSize)}`;

  if (attachment.kind === "image") {
    if (attachment.byteSize > opts.imageMaxBytes) {
      return {
        kind: "note",
        note: `[Image “${label}” skipped for the model (too large; ${meta}). Kept as filename note.]`,
      };
    }
    const bytes = await loadBytes();
    if (!bytes) {
      return {
        kind: "note",
        note: `[Image “${label}” could not be loaded for the model (${meta}).]`,
      };
    }
    return {
      kind: "image",
      bytes,
      mediaType: attachment.contentType || undefined,
      note: `image:${label}`,
    };
  }

  if (attachment.kind === "pdf" || attachment.contentType === "application/pdf") {
    if (attachment.byteSize > MODEL_PDF_EXTRACT_MAX_BYTES) {
      return {
        kind: "note",
        note: `[PDF “${label}” not extracted (too large for Worker extract; ${meta}). Filename noted only.]`,
      };
    }
    const bytes = await loadBytes();
    if (!bytes) {
      return {
        kind: "note",
        note: `[PDF “${label}” could not be loaded (${meta}). Filename noted only.]`,
      };
    }
    const extracted = await extractPdfText(bytes);
    if (!extracted) {
      return {
        kind: "note",
        note: `[PDF “${label}” had no extractable text (${meta}). Filename noted only.]`,
      };
    }
    const { text, truncated } = truncateText(
      extracted,
      MODEL_TEXT_ATTACHMENT_MAX_CHARS,
    );
    return {
      kind: "text",
      text: `--- Begin PDF extract: ${label} (${meta}) ---\n${text}\n--- End PDF extract: ${label} ---`,
      note: truncated ? `pdf-truncated:${label}` : `pdf:${label}`,
    };
  }

  if (isTextLikeMime(attachment.contentType, attachment.filename)) {
    if (attachment.byteSize > MODEL_TEXT_ATTACHMENT_MAX_BYTES) {
      return {
        kind: "note",
        note: `[Text file “${label}” skipped (too large; ${meta}). Filename noted only.]`,
      };
    }
    const bytes = await loadBytes();
    if (!bytes) {
      return {
        kind: "note",
        note: `[Text file “${label}” could not be loaded (${meta}). Filename noted only.]`,
      };
    }
    const decoded = decodeUtf8(bytes);
    const { text, truncated } = truncateText(
      decoded,
      MODEL_TEXT_ATTACHMENT_MAX_CHARS,
    );
    return {
      kind: "text",
      text: `--- Begin file: ${label} (${meta}) ---\n${text}\n--- End file: ${label} ---`,
      note: truncated ? `text-truncated:${label}` : `text:${label}`,
    };
  }

  if (attachment.kind === "video") {
    return {
      kind: "note",
      note: `[Video “${label}” not sent to the model (${meta}). Filename + type noted only.]`,
    };
  }

  return {
    kind: "note",
    note: `[Attachment “${label}” not inlined for the model (${meta}). Filename noted only.]`,
  };
}

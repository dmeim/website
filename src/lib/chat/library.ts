import {
  LIBRARY_ALLOWED_MIME_EXACT,
  LIBRARY_ALLOWED_MIME_PREFIXES,
  LIBRARY_BLOCKED_EXTENSIONS,
  LIBRARY_MAX_BYTES,
} from "./constants";
import type { LibraryKind } from "./types";

/** Map MIME type → Library kind. */
export function libraryKindFromMime(contentType: string): LibraryKind {
  const mime = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "pdf";
  return "other";
}

export function extensionOfFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) return "";
  return base.slice(dot + 1).toLowerCase();
}

/** Strip path segments and neutralize unsafe characters. */
export function safeFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? "file";
  const cleaned = base
    .replace(/[^\w.\- ()[\]]+/g, "_")
    .replace(/^\.+/, "")
    .trim();
  const truncated = cleaned.slice(0, 180);
  return truncated.length > 0 ? truncated : "file";
}

export function isMimeAllowed(contentType: string): boolean {
  const mime = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!mime) return false;
  if (LIBRARY_ALLOWED_MIME_EXACT.has(mime)) return true;
  return LIBRARY_ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix));
}

export function isExtensionBlocked(filename: string): boolean {
  const ext = extensionOfFilename(filename);
  return ext !== "" && LIBRARY_BLOCKED_EXTENSIONS.has(ext);
}

export interface UploadValidationOk {
  ok: true;
  filename: string;
  contentType: string;
  kind: LibraryKind;
}

export interface UploadValidationErr {
  ok: false;
  error: string;
}

export function validateLibraryUpload(input: {
  filename: string;
  contentType: string;
  byteSize: number;
}): UploadValidationOk | UploadValidationErr {
  const filename = safeFilename(input.filename);
  if (isExtensionBlocked(filename)) {
    return { ok: false, error: "This file type is not allowed." };
  }
  if (input.byteSize <= 0) {
    return { ok: false, error: "Empty files are not allowed." };
  }
  if (input.byteSize > LIBRARY_MAX_BYTES) {
    return {
      ok: false,
      error: `File exceeds the ${Math.floor(LIBRARY_MAX_BYTES / (1024 * 1024))} MiB limit.`,
    };
  }
  const contentType =
    input.contentType.split(";")[0]?.trim().toLowerCase() ||
    "application/octet-stream";
  if (!isMimeAllowed(contentType)) {
    return { ok: false, error: "MIME type is not allowed." };
  }
  return {
    ok: true,
    filename,
    contentType,
    kind: libraryKindFromMime(contentType),
  };
}

export function libraryR2Key(assetId: string, filename: string): string {
  return `library/${assetId}/${safeFilename(filename)}`;
}

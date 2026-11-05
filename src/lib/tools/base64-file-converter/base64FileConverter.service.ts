/**
 * Base64 ↔ file helpers (mime sniffing, download naming, FileReader encode).
 * Native FileReader / btoa / atob — parity with it-tools base64-file-converter.
 */

import { isValidBase64, removePotentialDataAndMimePrefix } from "@/lib/tools/base64-string-converter";
import { getExtensionsForMime, getMimeForExtension } from "@/lib/tools/mime-types";

export { isValidBase64, removePotentialDataAndMimePrefix };

/** Magic-byte prefixes (base64) → MIME, matching it-tools downloadBase64. */
const COMMON_MIME_SIGNATURES: ReadonlyArray<readonly [string, string]> = [
  ["JVBERi0", "application/pdf"],
  ["R0lGODdh", "image/gif"],
  ["R0lGODlh", "image/gif"],
  ["iVBORw0KGgo", "image/png"],
  ["/9j/", "image/jpg"],
];

/** MIME → default extension for types this tool sniffs / commonly downloads. */
const MIME_TO_EXTENSION: Readonly<Record<string, string>> = {
  "application/pdf": "pdf",
  "image/gif": "gif",
  "image/png": "png",
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "text/plain": "txt",
  "application/octet-stream": "bin",
};

/** Extension → MIME when wrapping bare base64 for download. */
const EXTENSION_TO_MIME: Readonly<Record<string, string>> = {
  pdf: "application/pdf",
  gif: "image/gif",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  txt: "text/plain",
  bin: "application/octet-stream",
};

export function getMimeTypeFromBase64(base64String: string): {
  mimeType: string | undefined;
} {
  const [, mimeTypeFromBase64] = base64String.match(/data:(.*?);base64/i) ?? [];

  if (mimeTypeFromBase64) {
    return { mimeType: mimeTypeFromBase64 };
  }

  for (const [signature, mimeType] of COMMON_MIME_SIGNATURES) {
    if (base64String.startsWith(signature)) {
      return { mimeType };
    }
  }

  return { mimeType: undefined };
}

export function getExtensionFromMimeType(mimeType: string): string | undefined {
  const clean = mimeType.split(";")[0]!.trim().toLowerCase();
  return MIME_TO_EXTENSION[clean] ?? getExtensionsForMime(clean)[0];
}

export function getMimeTypeFromExtension(extension: string): string | undefined {
  const clean = extension.replace(/^\./, "").toLowerCase();
  return EXTENSION_TO_MIME[clean] ?? getMimeForExtension(clean);
}

export type DownloadFromBase64Options = {
  sourceValue: string;
  filename?: string;
  extension?: string;
  fileMimeType?: string;
};

export type DownloadFromBase64Result = {
  dataUrl: string;
  filename: string;
};

/**
 * Build a downloadable data URL + filename from a base64 (or data-URI) string.
 * Mirrors it-tools `downloadFromBase64` naming / wrapping rules.
 */
export function buildDownloadFromBase64({
  sourceValue,
  filename,
  extension,
  fileMimeType,
}: DownloadFromBase64Options): DownloadFromBase64Result {
  if (sourceValue === "") {
    throw new Error("Base64 string is empty");
  }

  const defaultExtension = extension ?? "txt";
  const { mimeType } = getMimeTypeFromBase64(sourceValue);

  // Anything without a data: prefix must be wrapped, including a sniffed signature: a bare string
  // would download the site's response for that path instead of the decoded bytes.
  let dataUrl = sourceValue;
  if (!/^data:/i.test(sourceValue)) {
    const targetMimeType =
      mimeType ??
      fileMimeType ??
      getMimeTypeFromExtension(defaultExtension) ??
      "application/octet-stream";
    dataUrl = `data:${targetMimeType};base64,${removePotentialDataAndMimePrefix(sourceValue)}`;
  }

  const cleanExtension =
    extension ??
    (mimeType ? getExtensionFromMimeType(mimeType) : undefined) ??
    defaultExtension;

  let cleanFileName = filename ?? `file.${cleanExtension}`;
  if (extension && !cleanFileName.endsWith(`.${extension}`)) {
    cleanFileName = `${cleanFileName}.${cleanExtension}`;
  }

  return { dataUrl, filename: cleanFileName };
}

/**
 * Resolve preview `src` for an `<img>`.
 * If the string already has a data URI, use it; otherwise wrap it as an image.
 * A bare string would load as a relative URL, sending the payload to the server.
 */
export function resolvePreviewImageSrc(base64String: string): string {
  if (base64String === "") {
    throw new Error("Base64 string is empty");
  }

  if (/^data:/i.test(base64String)) {
    return base64String;
  }

  const { mimeType } = getMimeTypeFromBase64(base64String);
  // Browsers sniff the real format from the bytes for any image/* type.
  const imageType = mimeType?.startsWith("image/") ? mimeType : "image/png";
  return `data:${imageType};base64,${base64String}`;
}

/** Encode a File/Blob to a data URL via FileReader (parity with VueUse useBase64). */
export function fileToBase64DataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
        return;
      }
      reject(new Error("Failed to read file as base64"));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read file as base64"));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * When base64 input changes, suggest an extension from sniffed MIME
 * (keeps previous extension if sniff fails — it-tools watch behavior).
 */
export function suggestExtensionFromBase64(
  base64String: string,
  currentExtension: string,
): string {
  const { mimeType } = getMimeTypeFromBase64(base64String);
  if (!mimeType) {
    return currentExtension;
  }
  return getExtensionFromMimeType(mimeType) || currentExtension;
}

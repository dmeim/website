/**
 * MIME type ↔ file extension lookups.
 * Parity with it-tools mime-types (`mime-types` / mime-db maps, browser-safe).
 */

import mimeDb from "mime-db";

export type MimeInfo = {
  mimeType: string;
  extensions: string[];
};

type MimeDbEntry = {
  source?: string;
  extensions?: string[];
};

/** mime-types 2.x source preference (nginx < apache < undefined < iana). */
const SOURCE_PREFERENCE = ["nginx", "apache", undefined, "iana"] as const;

function buildMaps(): {
  extensionToMimeType: Record<string, string>;
  mimeTypeToExtensions: Record<string, string[]>;
} {
  const extensionToMimeType: Record<string, string> = Object.create(null);
  const mimeTypeToExtensions: Record<string, string[]> = Object.create(null);
  const db = mimeDb as Record<string, MimeDbEntry>;

  for (const type of Object.keys(db)) {
    const mime = db[type];
    const exts = mime?.extensions;
    if (!exts || exts.length === 0) continue;

    mimeTypeToExtensions[type] = exts;

    for (const extension of exts) {
      const existing = extensionToMimeType[extension];
      if (existing) {
        const from = SOURCE_PREFERENCE.indexOf(
          db[existing]?.source as (typeof SOURCE_PREFERENCE)[number],
        );
        const to = SOURCE_PREFERENCE.indexOf(
          mime.source as (typeof SOURCE_PREFERENCE)[number],
        );

        // Prefer higher-ranked sources; keep application/* when ranks tie (mime-types 2.x).
        if (
          existing !== "application/octet-stream" &&
          (from > to || (from === to && existing.slice(0, 12) === "application/"))
        ) {
          continue;
        }
      }

      extensionToMimeType[extension] = type;
    }
  }

  return { extensionToMimeType, mimeTypeToExtensions };
}

const maps = buildMaps();

/** Extension → MIME type map (keys without leading dot). */
export const extensionToMimeType: Readonly<Record<string, string>> =
  maps.extensionToMimeType;

/** MIME type → extensions map. */
export const mimeTypeToExtensions: Readonly<Record<string, string[]>> =
  maps.mimeTypeToExtensions;

/** Sorted MIME types that have at least one extension. */
export function listMimeTypes(): string[] {
  return Object.keys(mimeTypeToExtensions).sort((a, b) => a.localeCompare(b));
}

/** Sorted file extensions (without leading dot). */
export function listExtensions(): string[] {
  return Object.keys(extensionToMimeType).sort((a, b) => a.localeCompare(b));
}

/** All MIME ↔ extension rows for the reference table. */
export function listMimeInfos(): MimeInfo[] {
  return listMimeTypes().map((mimeType) => ({
    mimeType,
    extensions: mimeTypeToExtensions[mimeType] ?? [],
  }));
}

/** Normalize user input to an extension key (`pdf`, not `.pdf`). */
export function normalizeExtension(value: string): string {
  return value.trim().replace(/^\./, "").toLowerCase();
}

/** Extensions associated with a MIME type (empty if unknown). */
export function getExtensionsForMime(mimeType: string): string[] {
  const trimmed = mimeType.trim();
  if (!trimmed) return [];
  return (
    mimeTypeToExtensions[trimmed] ??
    mimeTypeToExtensions[trimmed.toLowerCase()] ??
    []
  );
}

/** MIME type for an extension, or `undefined` if unknown. */
export function getMimeForExtension(extension: string): string | undefined {
  const key = normalizeExtension(extension);
  if (!key) return undefined;
  return extensionToMimeType[key];
}

/** Whether a MIME type exists in the map. */
export function isKnownMimeType(mimeType: string): boolean {
  const trimmed = mimeType.trim();
  if (!trimmed) return false;
  return (
    Object.prototype.hasOwnProperty.call(mimeTypeToExtensions, trimmed) ||
    Object.prototype.hasOwnProperty.call(mimeTypeToExtensions, trimmed.toLowerCase())
  );
}

/** Whether an extension exists in the map. */
export function isKnownExtension(extension: string): boolean {
  const key = normalizeExtension(extension);
  if (!key) return false;
  return Object.prototype.hasOwnProperty.call(extensionToMimeType, key);
}

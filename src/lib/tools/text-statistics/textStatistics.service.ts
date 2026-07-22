/**
 * Text statistics — character, word, line, and UTF-8 byte size
 * (parity with it-tools text-statistics).
 */

export function getStringSizeInBytes(text: string): number {
  return new TextEncoder().encode(text).buffer.byteLength;
}

/** Format a byte count as human-readable size (it-tools `formatBytes`). */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`;
}

export type TextStatistics = {
  characterCount: number;
  wordCount: number;
  lineCount: number;
  byteSize: number;
  byteSizeFormatted: string;
};

/** Compute live text stats matching it-tools template logic. */
export function getTextStatistics(text: string): TextStatistics {
  const byteSize = getStringSizeInBytes(text);

  return {
    characterCount: text.length,
    wordCount: text === "" ? 0 : text.split(/\s+/).length,
    lineCount: text === "" ? 0 : text.split(/\r\n|\r|\n/).length,
    byteSize,
    byteSizeFormatted: formatBytes(byteSize),
  };
}

/**
 * Text statistics — character, word, line, and UTF-8 byte size
 * (parity with it-tools text-statistics).
 */

const graphemeSegmenter =
  typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

/** Split into user-perceived characters so emoji and combining marks stay whole. */
export function splitGraphemes(text: string): string[] {
  return graphemeSegmenter
    ? Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment)
    : Array.from(text);
}

export function getStringSizeInBytes(text: string): number {
  return new TextEncoder().encode(text).buffer.byteLength;
}

/** Format a byte count as human-readable size (it-tools `formatBytes`). */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) {
    return "0 Bytes";
  }

  if (bytes === 1) {
    return "1 Byte";
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

/** Live text stats. Unlike it-tools, characters are graphemes and surrounding whitespace adds no words. */
export function getTextStatistics(text: string): TextStatistics {
  const byteSize = getStringSizeInBytes(text);
  const trimmed = text.trim();

  return {
    characterCount: splitGraphemes(text).length,
    wordCount: trimmed === "" ? 0 : trimmed.split(/\s+/).length,
    lineCount: text === "" ? 0 : text.split(/\r\n|\r|\n/).length,
    byteSize,
    byteSizeFormatted: formatBytes(byteSize),
  };
}

import { describe, expect, it } from "vitest";

import {
  formatBytes,
  getStringSizeInBytes,
  getTextStatistics,
} from "./textStatistics.service";

describe("text-statistics", () => {
  describe("getStringSizeInBytes", () => {
    it("returns the size of a string in bytes", () => {
      expect(getStringSizeInBytes("")).toEqual(0);
      expect(getStringSizeInBytes("a")).toEqual(1);
      expect(getStringSizeInBytes("aa")).toEqual(2);
      expect(getStringSizeInBytes("😀")).toEqual(4);
      expect(getStringSizeInBytes("aaaaaaaaaa")).toEqual(10);
    });
  });

  describe("formatBytes", () => {
    it("formats zero and small sizes", () => {
      expect(formatBytes(0)).toBe("0 Bytes");
      expect(formatBytes(1)).toBe("1 Bytes");
      expect(formatBytes(1024)).toBe("1 KB");
    });
  });

  describe("getTextStatistics", () => {
    it("returns zeros for empty text", () => {
      expect(getTextStatistics("")).toEqual({
        characterCount: 0,
        wordCount: 0,
        lineCount: 0,
        byteSize: 0,
        byteSizeFormatted: "0 Bytes",
      });
    });

    it("counts characters, words, lines, and bytes", () => {
      const stats = getTextStatistics("hello world\nline two");
      expect(stats.characterCount).toBe(20);
      expect(stats.wordCount).toBe(4);
      expect(stats.lineCount).toBe(2);
      expect(stats.byteSize).toBe(20);
      expect(stats.byteSizeFormatted).toBe("20 Bytes");
    });

    it("counts emoji by UTF-16 length and UTF-8 bytes", () => {
      const stats = getTextStatistics("😀");
      expect(stats.characterCount).toBe(2);
      expect(stats.wordCount).toBe(1);
      expect(stats.lineCount).toBe(1);
      expect(stats.byteSize).toBe(4);
      expect(stats.byteSizeFormatted).toBe("4 Bytes");
    });

    it("handles CRLF and lone CR line breaks", () => {
      expect(getTextStatistics("a\r\nb").lineCount).toBe(2);
      expect(getTextStatistics("a\rb").lineCount).toBe(2);
    });
  });
});

import { describe, expect, it } from "vitest";

import {
  SEARCH_RESULT_GROUP,
  capitalizeTitle,
  countEmojis,
  emojis,
  emojisGroups,
  escapeUnicode,
  filterEmojiGroups,
  getEmojiCodePoints,
  getEmojiInfo,
} from "./emojiPicker.service";

describe("emoji-picker", () => {
  describe("escapeUnicode / getEmojiCodePoints", () => {
    it("escapes UTF-16 units as \\uXXXX sequences", () => {
      expect(escapeUnicode({ emoji: "A" })).toBe("\\u0041");
      expect(escapeUnicode({ emoji: "😀" })).toBe("\\ud83d\\ude00");
    });

    it("returns the first code point as 0x hex", () => {
      expect(getEmojiCodePoints({ emoji: "😀" })).toBe("0x1f600");
      expect(getEmojiCodePoints({ emoji: "" })).toBeUndefined();
    });
  });

  describe("capitalizeTitle", () => {
    it("matches lodash capitalize", () => {
      expect(capitalizeTitle("grinning face")).toBe("Grinning face");
      expect(capitalizeTitle("OK")).toBe("Ok");
      expect(capitalizeTitle("")).toBe("");
    });
  });

  describe("catalogue", () => {
    it("loads a substantial emoji set with expected groups", () => {
      expect(countEmojis()).toBeGreaterThan(1000);
      expect(emojis.length).toBe(countEmojis());

      const groups = emojisGroups.map((entry) => entry.group);
      expect(groups).toEqual([
        "Smileys & Emotion",
        "People & Body",
        "Animals & Nature",
        "Food & Drink",
        "Travel & Places",
        "Activities",
        "Objects",
        "Symbols",
        "Flags",
      ]);

      const totalInGroups = emojisGroups.reduce(
        (sum, group) => sum + group.emojiInfos.length,
        0,
      );
      expect(totalInGroups).toBe(emojis.length);
    });

    it("enriches grinning face with title, unicode, code points, keywords", () => {
      const grinning = getEmojiInfo("😀");
      expect(grinning).toBeDefined();
      expect(grinning!.title).toBe("Grinning face");
      expect(grinning!.name).toBe("grinning face");
      expect(grinning!.group).toBe("Smileys & Emotion");
      expect(grinning!.codePoints).toBe("0x1f600");
      expect(grinning!.unicode).toBe("\\ud83d\\ude00");
      expect(grinning!.keywords).toEqual(
        expect.arrayContaining(["face", "smile", "happy"]),
      );
    });
  });

  describe("filterEmojiGroups", () => {
    it("returns category groups when the query is blank", () => {
      expect(filterEmojiGroups("")).toBe(emojisGroups);
      expect(filterEmojiGroups("   ")).toBe(emojisGroups);
    });

    it("collapses matches into a Search result group", () => {
      const result = filterEmojiGroups("smile");
      expect(result).toHaveLength(1);
      expect(result[0].group).toBe(SEARCH_RESULT_GROUP);
      expect(result[0].emojiInfos.length).toBeGreaterThan(0);
      expect(
        result[0].emojiInfos.some(
          (entry) =>
            entry.name.includes("smile") ||
            entry.keywords?.some((keyword) => keyword.includes("smile")),
        ),
      ).toBe(true);
    });

    it("can match by emoji character", () => {
      const result = filterEmojiGroups("😀");
      expect(result[0].emojiInfos.some((entry) => entry.emoji === "😀")).toBe(
        true,
      );
    });

    it("returns an empty Search result group when nothing matches", () => {
      const result = filterEmojiGroups("zzzz-no-such-emoji-xyz");
      expect(result).toEqual([
        { group: SEARCH_RESULT_GROUP, emojiInfos: [] },
      ]);
    });
  });
});

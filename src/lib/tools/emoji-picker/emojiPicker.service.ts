/**
 * Emoji picker — searchable emoji catalogue with unicode / code-point values.
 * Parity with it-tools emoji-picker (`unicode-emoji-json` + `emojilib` + Fuse).
 */

import emojiKeywords from "emojilib";
import Fuse from "fuse.js";
import emojiUnicodeData from "unicode-emoji-json";

export type EmojiInfo = {
  emoji: string;
  name: string;
  slug: string;
  group: string;
  emoji_version: string;
  unicode_version: string;
  skin_tone_support: boolean;
  skin_tone_support_unicode_version?: string;
  title: string;
  keywords: string[] | undefined;
  codePoints: string | undefined;
  unicode: string;
};

export type EmojiGroup = {
  group: string;
  emojiInfos: EmojiInfo[];
};

export const SEARCH_RESULT_GROUP = "Search result";

export const SEARCH_DEBOUNCE_MS = 500;

/** Escape each UTF-16 code unit as `\uXXXX` (it-tools parity). */
export function escapeUnicode({ emoji }: { emoji: string }): string {
  return emoji
    .split("")
    .map((unit) => `\\u${unit.charCodeAt(0).toString(16).padStart(4, "0")}`)
    .join("");
}

/** First code point as `0x…` hex (it-tools parity). */
export function getEmojiCodePoints({
  emoji,
}: {
  emoji: string;
}): string | undefined {
  const codePoint = emoji.codePointAt(0);
  return codePoint !== undefined ? `0x${codePoint.toString(16)}` : undefined;
}

/** Capitalize first character; lowercase the rest (lodash `capitalize`). */
export function capitalizeTitle(name: string): string {
  if (!name) {
    return name;
  }
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function buildEmojiInfos(): EmojiInfo[] {
  return Object.entries(emojiUnicodeData).map(([emoji, info]) => ({
    ...info,
    emoji,
    title: capitalizeTitle(info.name),
    keywords: emojiKeywords[emoji as keyof typeof emojiKeywords] as
      | string[]
      | undefined,
    codePoints: getEmojiCodePoints({ emoji }),
    unicode: escapeUnicode({ emoji }),
  }));
}

/** Full emoji catalogue, built once from unicode-emoji-json + emojilib. */
export const emojis: EmojiInfo[] = buildEmojiInfos();

/** Emojis grouped by unicode group label (Smileys & Emotion, …). */
export const emojisGroups: EmojiGroup[] = (() => {
  const byGroup = new Map<string, EmojiInfo[]>();
  for (const emojiInfo of emojis) {
    const list = byGroup.get(emojiInfo.group);
    if (list) {
      list.push(emojiInfo);
    } else {
      byGroup.set(emojiInfo.group, [emojiInfo]);
    }
  }
  return [...byGroup.entries()].map(([group, emojiInfos]) => ({
    group,
    emojiInfos,
  }));
})();

const fuse = new Fuse(emojis, {
  keys: [
    "group",
    { name: "name", weight: 3 },
    "keywords",
    "unicode",
    "codePoints",
    "emoji",
  ],
  threshold: 0.3,
  useExtendedSearch: true,
  isCaseSensitive: false,
});

/**
 * Search emojis with Fuse (it-tools options). Empty / whitespace query
 * returns the category groups; otherwise a single "Search result" group.
 */
export function filterEmojiGroups(query: string): EmojiGroup[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return emojisGroups;
  }

  const matches = fuse.search(trimmed).map(({ item }) => item);
  return [{ group: SEARCH_RESULT_GROUP, emojiInfos: matches }];
}

/** Total emojis in the catalogue. */
export function countEmojis(): number {
  return emojis.length;
}

/** Look up a single emoji character in the catalogue. */
export function getEmojiInfo(emoji: string): EmojiInfo | undefined {
  return emojis.find((entry) => entry.emoji === emoji);
}

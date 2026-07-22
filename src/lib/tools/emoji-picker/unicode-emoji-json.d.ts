declare module "unicode-emoji-json" {
  export type UnicodeEmojiEntry = {
    name: string;
    slug: string;
    group: string;
    emoji_version: string;
    unicode_version: string;
    skin_tone_support: boolean;
    skin_tone_support_unicode_version?: string;
  };

  const emojiUnicodeData: Record<string, UnicodeEmojiEntry>;
  export default emojiUnicodeData;
}

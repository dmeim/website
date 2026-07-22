# Emoji picker

## Name
Emoji picker (`emoji-picker`)

## Description
Copy and paste emojis easily and get the unicode and code points value of each emoji.

## Toggles and Settings
- None (search is live with a 500 ms debounce)

## Inputs
- Search query (fuzzy match over group, name, keywords, unicode escapes, code points, and the emoji itself)

## Outputs
- Categorized emoji grids (Smileys & Emotion → Flags), or a single “Search result” group when filtering
- Each card shows the emoji, title, code point (`0x…`), and `\uXXXX` unicode escapes
- Click emoji / code point / unicode to copy that value

## Notes
- Data from `unicode-emoji-json` + keywords from `emojilib` (same as it-tools)
- Search via `fuse.js` with it-tools options (name weight 3, threshold 0.3, extended search)
- Catalogue id: `emoji-picker`

## Source
Port of [it-tools Emoji picker](https://it-tools.tech/emoji-picker). Local reference: handy-dandy `it-tools` (`src/tools/emoji-picker/`).

## Files
- `src/lib/tools/emoji-picker/` — service, tests, README, type shim
- `src/components/tools/islands/EmojiPicker.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `emoji-picker`

## How to verify
```bash
npm test -- src/lib/tools/emoji-picker
npm run build
```
Open `/tools/emoji-picker`, search for `smile`, and click an emoji / code point / unicode escape to copy.

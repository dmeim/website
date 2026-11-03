/**
 * Closed set of icons the site may use, keyed by Phosphor's kebab-case name.
 * Glyph path data is generated into glyphs-island.ts and glyphs-page.ts by
 * `npm run icons` (scripts/build-icons.mjs); rerun it after editing a list.
 *
 * - islandIconNames: icons React islands may render. Their paths ship to the
 *   browser, so keep this list to what islands actually use.
 * - pageIconNames: icons only .astro markup uses. Rendered at build time,
 *   they cost no JavaScript.
 * - tokenIconNames: crypto marks from web3icons (see token-icons.tsx), .astro only.
 *
 * Add a name (alphabetical) to the right list before using a new icon.
 */

export const islandIconNames = [
  "arrow-clockwise",
  "arrow-counter-clockwise",
  "arrow-elbow-down-left",
  "arrow-left",
  "arrow-right",
  "arrow-square-out",
  "arrow-up-right",
  "arrows-clockwise",
  "arrows-left-right",
  "at",
  "books",
  "camera",
  "caret-down",
  "caret-left",
  "caret-right",
  "check",
  "check-circle",
  "circle-half",
  "circle-notch",
  "code",
  "code-block",
  "copy",
  "corners-in",
  "corners-out",
  "download-simple",
  "envelope-simple",
  "eraser",
  "eye",
  "eye-slash",
  "file",
  "gear",
  "gif",
  "git-branch",
  "github-logo",
  "globe",
  "image",
  "images",
  "info",
  "key",
  "link",
  "list",
  "list-bullets",
  "list-numbers",
  "lock",
  "lock-open",
  "magnifying-glass",
  "minus",
  "moon",
  "pause",
  "pencil-simple",
  "play",
  "plus",
  "printer",
  "push-pin",
  "question",
  "quotes",
  "record",
  "scroll",
  "shuffle",
  "skip-forward",
  "stack",
  "stop",
  "sun",
  "text-b",
  "text-h-four",
  "text-h-one",
  "text-h-three",
  "text-h-two",
  "text-italic",
  "text-strikethrough",
  "timer",
  "trash",
  "upload-simple",
  "video-camera",
  "warning",
  "warning-circle",
  "x",
] as const;

export const pageIconNames = [
  "archive",
  "arrow-down",
  "arrow-up",
  "bell",
  "box-arrow-up",
  "brain",
  "calendar",
  "caret-up",
  "chat-circle",
  "clipboard-text",
  "clock",
  "dots-three",
  "file-text",
  "film-strip",
  "funnel",
  "gauge",
  "git-fork",
  "grid-four",
  "house",
  "keyboard",
  "map-pin",
  "monitor",
  "music-notes",
  "note-pencil",
  "palette",
  "paper-plane-right",
  "pulse",
  "shield-check",
  "sidebar-simple",
  "sliders-horizontal",
  "toolbox",
  "waveform",
  "wrench",
  "x-circle",
] as const;

export const tokenIconNames = [
  "token-btc",
  "token-doge",
  "token-eth",
  "token-sol",
  "token-trx",
  "token-usdc",
  "token-usdt",
  "token-xrp",
] as const;

export type IslandIconName = (typeof islandIconNames)[number];
export type TokenIconName = (typeof tokenIconNames)[number];
export type IconName = IslandIconName | (typeof pageIconNames)[number] | TokenIconName;

/** Phosphor weights the site uses; thin and duotone are not shipped. */
export type IconWeight = "regular" | "bold" | "fill" | "light";
export const iconWeights: readonly IconWeight[] = ["regular", "bold", "fill", "light"];

export const iconNames: IconName[] = [...islandIconNames, ...pageIconNames, ...tokenIconNames].sort();

export function isTokenIcon(name: IconName): name is TokenIconName {
  return name.startsWith("token-");
}

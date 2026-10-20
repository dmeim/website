import type { WallBackground } from "../lib/orthodox/types";

/**
 * Display names for icon collections. A collection is any folder under
 * `src/assets/orthodox/icons/`; folders without an entry here get a title
 * derived from the folder name ("great-feasts" → "Great Feasts").
 */
export const collectionLabels: Record<string, string> = {};

/** Picker order for collections; folders not listed sort alphabetically after these. */
export const collectionOrder: readonly string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Painted-wall presets that need no image. Uploaded photos in
 * `src/assets/orthodox/backgrounds/` are listed ahead of these.
 */
export const wallPresets: WallBackground[] = [
  {
    id: "limewash",
    label: "Limewash",
    css: "radial-gradient(ellipse 120% 90% at 50% 12%, #f3ebdb 0%, #e3d6be 48%, #c4b393 100%)",
  },
  {
    id: "ochre",
    label: "Ochre plaster",
    css: "radial-gradient(ellipse 120% 90% at 50% 12%, #dcb67a 0%, #b88c50 52%, #7a5a31 100%)",
  },
  {
    id: "byzantine-blue",
    label: "Byzantine blue",
    css: "radial-gradient(ellipse 120% 90% at 50% 12%, #44617f 0%, #263d58 52%, #111b29 100%)",
  },
  {
    id: "oxblood",
    label: "Oxblood",
    css: "radial-gradient(ellipse 120% 90% at 50% 12%, #7d2e26 0%, #561b16 52%, #260a08 100%)",
  },
  {
    id: "wood-panel",
    label: "Wood panel",
    css: "linear-gradient(180deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.35)), repeating-linear-gradient(90deg, #5e3e24 0 9.5%, #3a2412 9.5% 9.8%, #66452a 9.8% 19.6%, #3a2412 19.6% 20%)",
  },
  {
    id: "candlelit",
    label: "Candlelit",
    css: "radial-gradient(ellipse 80% 70% at 50% 78%, #4a3219 0%, #1f150b 52%, #070504 100%)",
  },
];

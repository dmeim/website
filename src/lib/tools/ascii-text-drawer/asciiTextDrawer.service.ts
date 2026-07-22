/**
 * ASCII art text drawer via figlet (parity with it-tools ascii-text-drawer).
 */

import figlet from "figlet";

export const DEFAULT_INPUT = "Ascii ART";
export const DEFAULT_FONT = "Standard";
export const DEFAULT_WIDTH = 80;
export const WIDTH_MIN = 0;
export const WIDTH_MAX = 10000;

/** CDN used by the browser build to fetch FIGfonts (parity with it-tools). */
export const FIGLET_FONT_PATH = "https://unpkg.com/figlet@1.11.3/fonts/";

export const ASCII_FONTS = [
  "1Row",
  "3-D",
  "3D Diagonal",
  "3D-ASCII",
  "3x5",
  "4Max",
  "5 Line Oblique",
  "AMC 3 Line",
  "AMC 3 Liv1",
  "AMC AAA01",
  "AMC Neko",
  "AMC Razor",
  "AMC Razor2",
  "AMC Slash",
  "AMC Slider",
  "AMC Thin",
  "AMC Tubes",
  "AMC Untitled",
  "ANSI Shadow",
  "ASCII New Roman",
  "Acrobatic",
  "Alligator",
  "Alligator2",
  "Alpha",
  "Alphabet",
  "Arrows",
  "Avatar",
  "B1FF",
  "Banner",
  "Banner3-D",
  "Banner3",
  "Banner4",
  "Barbwire",
  "Basic",
  "Bear",
  "Bell",
  "Benjamin",
  "Big Chief",
  "Big Money-ne",
  "Big Money-nw",
  "Big Money-se",
  "Big Money-sw",
  "Big",
  "Bigfig",
  "Binary",
  "Block",
  "Blocks",
  "Bloody",
  "Bolger",
  "Braced",
  "Bright",
  "Broadway KB",
  "Broadway",
  "Bubble",
  "Bulbhead",
  "Caligraphy",
  "Caligraphy2",
  "Calvin S",
  "Cards",
  "Catwalk",
  "Chiseled",
  "Chunky",
  "Coinstak",
  "Cola",
  "Colossal",
  "Computer",
  "Contessa",
  "Contrast",
  "Cosmike",
  "Crawford",
  "Crawford2",
  "Crazy",
  "Cricket",
  "Cursive",
  "Cyberlarge",
  "Cybermedium",
  "Cybersmall",
  "Cygnet",
  "DANC4",
  "DOS Rebel",
  "DWhistled",
  "Dancing Font",
  "Decimal",
  "Def Leppard",
  "Delta Corps Priest 1",
  "Diamond",
  "Diet Cola",
  "Digital",
  "Doh",
  "Doom",
  "Dot Matrix",
  "Double Shorts",
  "Double",
  "Dr Pepper",
  "Efti Chess",
  "Efti Font",
  "Efti Italic",
  "Efti Piti",
  "Efti Robot",
  "Efti Wall",
  "Efti Water",
  "Electronic",
  "Elite",
  "Epic",
  "Fender",
  "Filter",
  "Fire Font-k",
  "Fire Font-s",
  "Flipped",
  "Flower Power",
  "Four Tops",
  "Fraktur",
  "Fun Face",
  "Fun Faces",
  "Fuzzy",
  "Georgi16",
  "Georgia11",
  "Ghost",
  "Ghoulish",
  "Glenyn",
  "Goofy",
  "Gothic",
  "Graceful",
  "Gradient",
  "Graffiti",
  "Greek",
  "Heart Left",
  "Heart Right",
  "Henry 3D",
  "Hex",
  "Hieroglyphs",
  "Hollywood",
  "Horizontal Left",
  "Horizontal Right",
  "ICL-1900",
  "Impossible",
  "Invita",
  "Isometric1",
  "Isometric2",
  "Isometric3",
  "Isometric4",
  "Italic",
  "Ivrit",
  "JS Block Letters",
  "JS Bracket Letters",
  "JS Capital Curves",
  "JS Cursive",
  "JS Stick Letters",
  "Jacky",
  "Jazmine",
  "Jerusalem",
  "Katakana",
  "Kban",
  "Keyboard",
  "Knob",
  "Konto Slant",
  "Konto",
  "LCD",
  "Larry 3D 2",
  "Larry 3D",
  "Lean",
  "Letters",
  "Lil Devil",
  "Line Blocks",
  "Linux",
  "Lockergnome",
  "Madrid",
  "Marquee",
  "Maxfour",
  "Merlin1",
  "Merlin2",
  "Mike",
  "Mini",
  "Mirror",
  "Mnemonic",
  "Modular",
  "Morse",
  "Morse2",
  "Moscow",
  "Mshebrew210",
  "Muzzle",
  "NScript",
  "NT Greek",
  "NV Script",
  "Nancyj-Fancy",
  "Nancyj-Improved",
  "Nancyj-Underlined",
  "Nancyj",
  "Nipples",
  "O8",
  "OS2",
  "Octal",
  "Ogre",
  "Old Banner",
  "Patorjk's Cheese",
  "Patorjk-HeX",
  "Pawp",
  "Peaks Slant",
  "Peaks",
  "Pebbles",
  "Pepper",
  "Poison",
  "Puffy",
  "Puzzle",
  "Pyramid",
  "Rammstein",
  "Rectangles",
  "Red Phoenix",
  "Relief",
  "Relief2",
  "Reverse",
  "Roman",
  "Rot13",
  "Rotated",
  "Rounded",
  "Rowan Cap",
  "Rozzo",
  "Runic",
  "Runyc",
  "S Blood",
  "SL Script",
  "Santa Clara",
  "Script",
  "Serifcap",
  "Shadow",
  "Shimrod",
  "Short",
  "Slant Relief",
  "Slant",
  "Slide",
  "Small Caps",
  "Small Isometric1",
  "Small Keyboard",
  "Small Poison",
  "Small Script",
  "Small Shadow",
  "Small Slant",
  "Small Tengwar",
  "Small",
  "Soft",
  "Speed",
  "Spliff",
  "Stacey",
  "Stampate",
  "Stampatello",
  "Standard",
  "Star Strips",
  "Star Wars",
  "Stellar",
  "Stforek",
  "Stick Letters",
  "Stop",
  "Straight",
  "Stronger Than All",
  "Sub-Zero",
  "Swamp Land",
  "Swan",
  "Sweet",
  "THIS",
  "Tanja",
  "Tengwar",
  "Term",
  "Test1",
  "The Edge",
  "Thick",
  "Thin",
  "Thorned",
  "Three Point",
  "Ticks Slant",
  "Ticks",
  "Tiles",
  "Tinker-Toy",
  "Tombstone",
  "Train",
  "Trek",
  "Tsalagi",
  "Tubular",
  "Twisted",
  "Two Point",
  "USA Flag",
  "Univers",
  "Varsity",
  "Wavy",
  "Weird",
  "Wet Letter",
  "Whimsy",
  "Wow",
] as const;

export type AsciiFont = (typeof ASCII_FONTS)[number];

export type AsciiRenderOptions = {
  font?: string;
  width?: number;
};

export type AsciiRenderResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

const FONT_SET = new Set<string>(ASCII_FONTS);

let browserFontsConfigured = false;

/** Configure figlet font fetching for browser islands. No-op in Node. */
export function configureBrowserFigletFonts(): void {
  if (typeof window === "undefined" || browserFontsConfigured) {
    return;
  }
  figlet.defaults({ fontPath: FIGLET_FONT_PATH });
  browserFontsConfigured = true;
}

export function clampWidth(width: number): number {
  if (!Number.isFinite(width)) {
    return DEFAULT_WIDTH;
  }
  return Math.min(WIDTH_MAX, Math.max(WIDTH_MIN, Math.trunc(width)));
}

export function normalizeFont(font: string): AsciiFont {
  if (FONT_SET.has(font)) {
    return font as AsciiFont;
  }
  return DEFAULT_FONT;
}

/**
 * Render input text as ASCII art with the given figlet font and wrap width.
 */
export async function renderAsciiText(
  input: string,
  options: AsciiRenderOptions = {},
): Promise<string> {
  configureBrowserFigletFonts();

  const font = normalizeFont(options.font ?? DEFAULT_FONT);
  const width = clampWidth(options.width ?? DEFAULT_WIDTH);

  const text = await figlet.text(input, {
    font,
    width,
    whitespaceBreak: true,
  });

  return text ?? "";
}

/** Like `renderAsciiText` but returns a result object instead of throwing. */
export async function tryRenderAsciiText(
  input: string,
  options: AsciiRenderOptions = {},
): Promise<AsciiRenderResult> {
  try {
    const text = await renderAsciiText(input, options);
    return { ok: true, text };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Current settings resulted in error.";
    return { ok: false, error: message };
  }
}

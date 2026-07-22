/**
 * Lorem ipsum placeholder text generator (parity with it-tools lorem-ipsum-generator).
 * Vocabulary and sentence/paragraph assembly match the upstream service.
 */

export const FIRST_SENTENCE =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

export const PARAGRAPH_COUNT_MIN = 1;
export const PARAGRAPH_COUNT_MAX = 20;
export const PARAGRAPH_COUNT_DEFAULT = 1;

export const SENTENCE_RANGE_MIN = 1;
export const SENTENCE_RANGE_MAX = 50;
export const SENTENCE_RANGE_DEFAULT: [number, number] = [3, 8];

export const WORD_RANGE_MIN = 1;
export const WORD_RANGE_MAX = 50;
export const WORD_RANGE_DEFAULT: [number, number] = [8, 15];

const vocabulary = [
  "a",
  "ac",
  "accumsan",
  "ad",
  "adipiscing",
  "aenean",
  "aliquam",
  "aliquet",
  "amet",
  "ante",
  "aptent",
  "arcu",
  "at",
  "auctor",
  "bibendum",
  "blandit",
  "class",
  "commodo",
  "condimentum",
  "congue",
  "consectetur",
  "consequat",
  "conubia",
  "convallis",
  "cras",
  "cubilia",
  "cum",
  "curabitur",
  "curae",
  "dapibus",
  "diam",
  "dictum",
  "dictumst",
  "dignissim",
  "dolor",
  "donec",
  "dui",
  "duis",
  "egestas",
  "eget",
  "eleifend",
  "elementum",
  "elit",
  "enim",
  "erat",
  "eros",
  "est",
  "et",
  "etiam",
  "eu",
  "euismod",
  "facilisi",
  "faucibus",
  "felis",
  "fermentum",
  "feugiat",
  "fringilla",
  "fusce",
  "gravida",
  "habitant",
  "habitasse",
  "hac",
  "hendrerit",
  "himenaeos",
  "iaculis",
  "id",
  "imperdiet",
  "in",
  "inceptos",
  "integer",
  "interdum",
  "ipsum",
  "justo",
  "lacinia",
  "lacus",
  "laoreet",
  "lectus",
  "leo",
  "ligula",
  "litora",
  "lobortis",
  "lorem",
  "luctus",
  "maecenas",
  "magna",
  "magnis",
  "malesuada",
  "massa",
  "mattis",
  "mauris",
  "metus",
  "mi",
  "molestie",
  "mollis",
  "montes",
  "morbi",
  "mus",
  "nam",
  "nascetur",
  "natoque",
  "nec",
  "neque",
  "netus",
  "nisi",
  "nisl",
  "non",
  "nostra",
  "nulla",
  "nullam",
  "nunc",
  "odio",
  "orci",
  "ornare",
  "parturient",
  "pellentesque",
  "penatibus",
  "per",
  "pharetra",
  "phasellus",
  "placerat",
  "platea",
  "porta",
  "porttitor",
  "posuere",
  "potenti",
  "praesent",
  "pretium",
  "primis",
  "proin",
  "pulvinar",
  "purus",
  "quam",
  "quis",
  "quisque",
  "rhoncus",
  "ridiculus",
  "risus",
  "rutrum",
  "sagittis",
  "sapien",
  "scelerisque",
  "sed",
  "sem",
  "semper",
  "senectus",
  "sit",
  "sociis",
  "sociosqu",
  "sodales",
  "sollicitudin",
  "suscipit",
  "suspendisse",
  "taciti",
  "tellus",
  "tempor",
  "tempus",
  "tincidunt",
  "torquent",
  "tortor",
  "turpis",
  "ullamcorper",
  "ultrices",
  "ultricies",
  "urna",
  "varius",
  "vehicula",
  "vel",
  "velit",
  "venenatis",
  "vestibulum",
  "vitae",
  "vivamus",
  "viverra",
  "volutpat",
  "vulputate",
] as const;

export type GenerateLoremIpsumOptions = {
  paragraphCount?: number;
  sentencePerParagraph?: number;
  wordCount?: number;
  startWithLoremIpsum?: boolean;
  asHTML?: boolean;
};

/** Pick a uniform random element (parity with it-tools `randFromArray`). */
export function randFromArray<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

/**
 * Uniform integer in `[min, max)` — parity with it-tools `randIntFromInterval`.
 * When `min === max`, returns `min`.
 */
export function randIntFromInterval(min: number, max: number): number {
  if (max <= min) {
    return min;
  }
  return Math.floor(Math.random() * (max - min) + min);
}

export function clampParagraphCount(value: number): number {
  if (!Number.isFinite(value)) {
    return PARAGRAPH_COUNT_DEFAULT;
  }
  return Math.min(
    PARAGRAPH_COUNT_MAX,
    Math.max(PARAGRAPH_COUNT_MIN, Math.round(value)),
  );
}

export function clampRangeBound(
  value: number,
  minBound: number,
  maxBound: number,
  fallback: number,
): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(maxBound, Math.max(minBound, Math.round(value)));
}

/** Keep `[lo, hi]` ordered and within UI bounds (inclusive ends for the slider). */
export function normalizeInclusiveRange(
  lo: number,
  hi: number,
  minBound: number,
  maxBound: number,
  fallback: [number, number],
): [number, number] {
  let a = clampRangeBound(lo, minBound, maxBound, fallback[0]);
  let b = clampRangeBound(hi, minBound, maxBound, fallback[1]);
  if (a > b) {
    [a, b] = [b, a];
  }
  return [a, b];
}

function generateSentence(length: number): string {
  const sentence = Array.from({ length }, () => randFromArray(vocabulary)).join(
    " ",
  );
  return `${sentence.charAt(0).toUpperCase() + sentence.slice(1)}.`;
}

export function generateLoremIpsum({
  paragraphCount = PARAGRAPH_COUNT_DEFAULT,
  sentencePerParagraph = SENTENCE_RANGE_DEFAULT[0],
  wordCount = WORD_RANGE_DEFAULT[0],
  startWithLoremIpsum = true,
  asHTML = false,
}: GenerateLoremIpsumOptions = {}): string {
  const paragraphs = Array.from({ length: paragraphCount }, () =>
    Array.from({ length: sentencePerParagraph }, () =>
      generateSentence(wordCount),
    ),
  );

  if (startWithLoremIpsum && paragraphs[0]?.[0] !== undefined) {
    paragraphs[0][0] = FIRST_SENTENCE;
  }

  if (asHTML) {
    return `<p>${paragraphs.map((s) => s.join(" ")).join("</p>\n\n<p>")}</p>`;
  }

  return paragraphs.map((s) => s.join(" ")).join("\n\n");
}

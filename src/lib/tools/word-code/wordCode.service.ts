import type {
  GenerateCodeOptions,
  GeneratedCode,
  LoadedWordCategories,
  OutputFormatOptions,
  WordCategory,
} from "./wordCode.types";

const categoryModules = import.meta.glob<unknown>("./data/categories/*.json", {
  import: "default",
});

export async function loadWordCategories(): Promise<LoadedWordCategories> {
  const entries = Object.entries(categoryModules).sort(([a], [b]) => a.localeCompare(b));

  if (!entries.length) {
    throw new Error("No .json Category Files Were Found In data/categories/.");
  }

  const loaded = await Promise.allSettled(
    entries.map(async ([path, load]) => {
      const payload = await load();
      const items = Array.isArray(payload) ? payload : [payload];
      return items.map((item, index) => normalizeCategory(item, path, index));
    }),
  );

  const categories: WordCategory[] = [];
  const warnings: string[] = [];

  loaded.forEach((result, index) => {
    const path = entries[index][0];

    if (result.status === "fulfilled") {
      categories.push(...result.value);
    } else {
      warnings.push(
        `${fileNameFromPath(path)}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
      );
    }
  });

  const sortedCategories = categories.sort((a, b) => a.name.localeCompare(b.name));

  if (!sortedCategories.length) {
    throw new Error("No Valid Categories Were Found In data/categories/.");
  }

  return {
    categories: sortedCategories,
    warnings,
    totalUniqueWords: countUniqueWords(sortedCategories.flatMap((category) => category.words)),
  };
}

export function normalizeCategory(item: unknown, path: string, index: number): WordCategory {
  if (!item || typeof item !== "object") {
    throw new Error("Category JSON Must Be An Object Or Array Of Objects.");
  }

  const record = item as Record<string, unknown>;
  const fileSlug = fileNameFromPath(path).replace(/\.json$/i, "");
  const id = slugify(record.id || record.name || `${fileSlug}-${index + 1}`);
  const words = uniqueWords(Array.isArray(record.words) ? record.words : []);

  if (!words.length) {
    throw new Error("Category Has No Words.");
  }

  const wordKeys = new Set(words.map((word) => word.toLowerCase()));
  const previewWords = uniqueWords(Array.isArray(record.previewWords) ? record.previewWords : [])
    .filter((word) => wordKeys.has(word.toLowerCase()))
    .slice(0, 5);

  return {
    id,
    name: String(record.name || titleFromSlug(id)).trim(),
    description: String(record.description || "").trim(),
    defaultSelected: record.defaultSelected !== false,
    file: fileNameFromPath(path),
    previewWords,
    words,
  };
}

export function parseExtraWords(value: string): string[] {
  return uniqueWords(value.split(/[\n,]+/));
}

export function getSelectedWords({
  categories,
  selectedCategoryIds,
  extraWords,
}: {
  categories: WordCategory[];
  selectedCategoryIds: string[];
  extraWords: string[];
}): string[] {
  const selectedIds = new Set(selectedCategoryIds);
  const categoryWords = categories
    .filter((category) => selectedIds.has(category.id))
    .flatMap((category) => category.words);

  return uniqueWords([...categoryWords, ...extraWords]);
}

export function applyLengthFilter(words: string[], min: number, max: number): string[] {
  return words.filter((word) => word.length >= min && word.length <= max);
}

export function generateCodeItems(options: GenerateCodeOptions): GeneratedCode[] {
  const { words, digits, requested, randomize, allowRepeats } = options;
  const result: GeneratedCode[] = [];
  const shuffledIndexes = randomize ? shuffle([...Array(words.length).keys()]) : [];

  for (let index = 0; index < requested; index += 1) {
    let wordIndex: number;

    if (allowRepeats) {
      wordIndex = randomize ? randomInt(words.length) : index % words.length;
    } else {
      wordIndex = randomize ? shuffledIndexes[index] : index;
    }

    const word = words[wordIndex];
    const number = padNumber(randomInt(10 ** digits), digits);
    result.push({ word, number });
  }

  return result;
}

export function formatOutput(codes: GeneratedCode[], options: OutputFormatOptions): string {
  const formattedCodes = codes.map((code) => formatCodeItem(code, options));

  if (options.format === "column") {
    return formattedCodes.join("\n");
  }

  return formattedCodes.join(getSeparator(options));
}

export function formatCodeItem(
  item: GeneratedCode,
  options: Pick<OutputFormatOptions, "position" | "wordCase">,
): string {
  const word = applyWordCase(item.word, item, options.wordCase);
  return options.position === "start" ? `${item.number}${word}` : `${word}${item.number}`;
}

export function applyWordCase(
  word: string,
  item: GeneratedCode,
  wordCase: OutputFormatOptions["wordCase"],
): string {
  switch (wordCase) {
    case "capitalize":
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    case "uppercase":
      return word.toUpperCase();
    case "lowercase":
      return word.toLowerCase();
    case "random":
      if (!item.randomCaseWord) {
        item.randomCaseWord = randomizeLetterCase(word);
      }
      return item.randomCaseWord;
    case "normal":
    default:
      return word;
  }
}

export function getSeparator(
  options: Pick<OutputFormatOptions, "separator" | "customSeparator" | "addSpaces">,
): string {
  let separator = options.separator === "custom" ? options.customSeparator : options.separator;

  if (options.addSpaces && separator !== " ") {
    separator += " ";
  }

  return separator;
}

export function uniqueWords(words: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  words.forEach((word) => {
    const normalized = String(word ?? "").trim();
    const key = normalized.toLowerCase();

    if (!normalized || seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(normalized);
  });

  return result;
}

export function countUniqueWords(words: unknown[]): number {
  return uniqueWords(words).length;
}

export function previewWords(category: WordCategory): string {
  const words = category.previewWords.length ? category.previewWords : category.words.slice(0, 5);
  return words.slice(0, 5).join(", ");
}

export function getLengthLabel({
  min,
  max,
  boundsMin,
  boundsMax,
}: {
  min: number;
  max: number;
  boundsMin: number;
  boundsMax: number;
}): string {
  const hasMin = min > boundsMin;
  const hasMax = max < boundsMax;

  if (!hasMin && !hasMax) {
    return "No Limits";
  }

  if (hasMin && !hasMax) {
    return `${min}+ Letters`;
  }

  if (!hasMin && hasMax) {
    return `Up To ${max} Letters`;
  }

  if (min === max) {
    return `${min} Letters`;
  }

  return `${min}-${max} Letters`;
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

export function padNumber(number: number, digits: number): string {
  return String(number).padStart(digits, "0");
}

export function randomInt(max: number): number {
  if (max <= 0) {
    return 0;
  }

  if (globalThis.crypto?.getRandomValues) {
    const maxUint32 = 0xffffffff;
    const limit = maxUint32 - (maxUint32 % max);
    const buffer = new Uint32Array(1);

    do {
      globalThis.crypto.getRandomValues(buffer);
    } while (buffer[0] >= limit);

    return buffer[0] % max;
  }

  return Math.floor(Math.random() * max);
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function randomizeLetterCase(word: string): string {
  return Array.from(word, (letter) => (randomInt(2) ? letter.toUpperCase() : letter.toLowerCase())).join(
    "",
  );
}

function slugify(value: unknown): string {
  return (
    String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "category"
  );
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function fileNameFromPath(path: string): string {
  return decodeURIComponent(path.split("/").pop() || "category.json");
}

export interface WordCategory {
  id: string;
  name: string;
  description: string;
  defaultSelected: boolean;
  file: string;
  previewWords: string[];
  words: string[];
}

export interface LoadedWordCategories {
  categories: WordCategory[];
  warnings: string[];
  totalUniqueWords: number;
}

export interface GeneratedCode {
  word: string;
  number: string;
  randomCaseWord?: string;
}

export type DigitPosition = "start" | "end";
export type WordCase = "normal" | "capitalize" | "uppercase" | "lowercase" | "random";
export type OutputFormat = "column" | "line";
export type SeparatorOption = "," | ";" | "." | " " | "custom";

export interface GenerateCodeOptions {
  words: string[];
  digits: number;
  requested: number;
  randomize: boolean;
  allowRepeats: boolean;
}

export interface OutputFormatOptions {
  format: OutputFormat;
  separator: SeparatorOption;
  customSeparator: string;
  addSpaces: boolean;
  position: DigitPosition;
  wordCase: WordCase;
}

import { entropyToMnemonic, mnemonicToEntropy, validateMnemonic } from "@scure/bip39";
import { wordlist as czech } from "@scure/bip39/wordlists/czech.js";
import { wordlist as english } from "@scure/bip39/wordlists/english.js";
import { wordlist as french } from "@scure/bip39/wordlists/french.js";
import { wordlist as italian } from "@scure/bip39/wordlists/italian.js";
import { wordlist as japanese } from "@scure/bip39/wordlists/japanese.js";
import { wordlist as korean } from "@scure/bip39/wordlists/korean.js";
import { wordlist as portuguese } from "@scure/bip39/wordlists/portuguese.js";
import { wordlist as chineseSimplified } from "@scure/bip39/wordlists/simplified-chinese.js";
import { wordlist as spanish } from "@scure/bip39/wordlists/spanish.js";
import { wordlist as chineseTraditional } from "@scure/bip39/wordlists/traditional-chinese.js";

/** BIP39 entropy bit strengths (multiples of 32 from 128–256). */
export const BIP39_STRENGTHS = [128, 160, 192, 224, 256] as const;

export type Bip39Strength = (typeof BIP39_STRENGTHS)[number];

/** Default strength: 128-bit → 32 hex chars / 12 words. */
export const BIP39_STRENGTH_DEFAULT: Bip39Strength = 128;

/** Valid entropy byte lengths for BIP39. */
export const BIP39_ENTROPY_BYTE_LENGTHS = [16, 20, 24, 28, 32] as const;

/** Valid entropy hex string lengths (2 × byte length). */
export const BIP39_ENTROPY_HEX_LENGTHS = [32, 40, 48, 56, 64] as const;

export const BIP39_LANGUAGES = [
  { id: "english", label: "English" },
  { id: "chinese-simplified", label: "Chinese simplified" },
  { id: "chinese-traditional", label: "Chinese traditional" },
  { id: "czech", label: "Czech" },
  { id: "french", label: "French" },
  { id: "italian", label: "Italian" },
  { id: "japanese", label: "Japanese" },
  { id: "korean", label: "Korean" },
  { id: "portuguese", label: "Portuguese" },
  { id: "spanish", label: "Spanish" },
] as const;

export type Bip39LanguageId = (typeof BIP39_LANGUAGES)[number]["id"];

export const BIP39_LANGUAGE_DEFAULT: Bip39LanguageId = "english";

const WORDLISTS: Record<Bip39LanguageId, string[]> = {
  english,
  "chinese-simplified": chineseSimplified,
  "chinese-traditional": chineseTraditional,
  czech,
  french,
  italian,
  japanese,
  korean,
  portuguese,
  spanish,
};

const STRENGTH_SET = new Set<number>(BIP39_STRENGTHS);
const HEX_LENGTH_SET = new Set<number>(BIP39_ENTROPY_HEX_LENGTHS);
const HEX_PATTERN = /^[0-9a-fA-F]+$/;

export function isBip39LanguageId(value: unknown): value is Bip39LanguageId {
  return typeof value === "string" && value in WORDLISTS;
}

export function normalizeBip39Language(
  value: unknown,
  fallback: Bip39LanguageId = BIP39_LANGUAGE_DEFAULT,
): Bip39LanguageId {
  return isBip39LanguageId(value) ? value : fallback;
}

export function isBip39Strength(value: unknown): value is Bip39Strength {
  return typeof value === "number" && STRENGTH_SET.has(value);
}

export function normalizeBip39Strength(
  value: unknown,
  fallback: Bip39Strength = BIP39_STRENGTH_DEFAULT,
): Bip39Strength {
  const parsed = typeof value === "number" ? value : Number(value);
  return isBip39Strength(parsed) ? parsed : fallback;
}

/** Word count for a BIP39 strength (12 / 15 / 18 / 21 / 24). */
export function bip39WordCount(strength: Bip39Strength): number {
  return (normalizeBip39Strength(strength) / 32) * 3;
}

/** Hex character count for a BIP39 strength. */
export function bip39EntropyHexLength(strength: Bip39Strength): number {
  return normalizeBip39Strength(strength) / 4;
}

export function getWordlist(language: Bip39LanguageId): string[] {
  return WORDLISTS[normalizeBip39Language(language)];
}

/** Decode a hex string into bytes. Throws on odd length or non-hex input. */
export function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.trim();

  if (normalized.length % 2 !== 0) {
    throw new Error("Hex string must have an even length");
  }

  if (normalized.length > 0 && !HEX_PATTERN.test(normalized)) {
    throw new Error("Hex string must contain only hexadecimal characters");
  }

  const bytes = new Uint8Array(normalized.length / 2);

  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }

  return bytes;
}

/** Encode bytes as a lowercase hex string. */
export function bytesToHex(bytes: Uint8Array): string {
  let out = "";

  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i]!.toString(16).padStart(2, "0");
  }

  return out;
}

/**
 * True when `hex` is a valid BIP39 entropy hex string:
 * even length in {32,40,48,56,64} and only hex digits.
 */
export function isValidEntropyHex(hex: string): boolean {
  const normalized = hex.trim();
  return HEX_LENGTH_SET.has(normalized.length) && HEX_PATTERN.test(normalized);
}

/** True when `mnemonic` validates against the language wordlist (checksum + words). */
export function isValidMnemonic(mnemonic: string, language: Bip39LanguageId): boolean {
  const trimmed = mnemonic.trim();
  if (!trimmed) {
    return false;
  }

  return validateMnemonic(trimmed, getWordlist(language));
}

/** Generate cryptographically random entropy as lowercase hex for `strength` bits. */
export function generateEntropyHex(strength: Bip39Strength = BIP39_STRENGTH_DEFAULT): string {
  const bits = normalizeBip39Strength(strength);
  const bytes = new Uint8Array(bits / 8);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

/**
 * Convert entropy hex → mnemonic for `language`.
 * Throws when entropy hex is not a valid BIP39 length / hex string.
 */
export function entropyHexToMnemonic(entropyHex: string, language: Bip39LanguageId): string {
  if (!isValidEntropyHex(entropyHex)) {
    throw new Error("Invalid BIP39 entropy hex");
  }

  return entropyToMnemonic(hexToBytes(entropyHex.trim()), getWordlist(language));
}

/**
 * Convert mnemonic → lowercase entropy hex for `language`.
 * Throws when the mnemonic is invalid for the wordlist.
 */
export function mnemonicToEntropyHex(mnemonic: string, language: Bip39LanguageId): string {
  const trimmed = mnemonic.trim();

  if (!isValidMnemonic(trimmed, language)) {
    throw new Error("Invalid BIP39 mnemonic");
  }

  return bytesToHex(mnemonicToEntropy(trimmed, getWordlist(language)));
}

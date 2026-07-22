import { describe, expect, it } from "vitest";

import {
  BIP39_ENTROPY_HEX_LENGTHS,
  BIP39_LANGUAGE_DEFAULT,
  BIP39_LANGUAGES,
  BIP39_STRENGTH_DEFAULT,
  BIP39_STRENGTHS,
  bip39EntropyHexLength,
  bip39WordCount,
  bytesToHex,
  entropyHexToMnemonic,
  generateEntropyHex,
  hexToBytes,
  isBip39LanguageId,
  isBip39Strength,
  isValidEntropyHex,
  isValidMnemonic,
  mnemonicToEntropyHex,
  normalizeBip39Language,
  normalizeBip39Strength,
} from "./bip39Generator.service";

/** Known BIP39 vector: 128-bit all-0x7f → English 12 words. */
const VECTOR_ENTROPY_HEX = "7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f";
const VECTOR_MNEMONIC =
  "legal winner thank year wave sausage worth useful legal winner thank yellow";

describe("bip39-generator", () => {
  describe("normalize helpers", () => {
    it("accepts known languages and strengths", () => {
      expect(isBip39LanguageId("english")).toBe(true);
      expect(isBip39LanguageId("japanese")).toBe(true);
      expect(isBip39LanguageId("klingon")).toBe(false);
      expect(normalizeBip39Language("french")).toBe("french");
      expect(normalizeBip39Language("nope")).toBe(BIP39_LANGUAGE_DEFAULT);

      expect(isBip39Strength(128)).toBe(true);
      expect(isBip39Strength(160)).toBe(true);
      expect(isBip39Strength(96)).toBe(false);
      expect(normalizeBip39Strength(256)).toBe(256);
      expect(normalizeBip39Strength("192")).toBe(192);
      expect(normalizeBip39Strength(99)).toBe(BIP39_STRENGTH_DEFAULT);
    });

    it("maps strength to word and hex lengths", () => {
      expect(bip39WordCount(128)).toBe(12);
      expect(bip39WordCount(160)).toBe(15);
      expect(bip39WordCount(192)).toBe(18);
      expect(bip39WordCount(224)).toBe(21);
      expect(bip39WordCount(256)).toBe(24);

      expect(bip39EntropyHexLength(128)).toBe(32);
      expect(bip39EntropyHexLength(256)).toBe(64);
      expect(BIP39_ENTROPY_HEX_LENGTHS).toEqual([32, 40, 48, 56, 64]);
    });

    it("lists ten language options", () => {
      expect(BIP39_LANGUAGES).toHaveLength(10);
      expect(BIP39_LANGUAGES.map((entry) => entry.id)).toContain("chinese-simplified");
      expect(BIP39_LANGUAGES.map((entry) => entry.id)).toContain("chinese-traditional");
    });
  });

  describe("hexToBytes / bytesToHex", () => {
    it("round-trips bytes", () => {
      const hex = "0a1b2c3d";
      expect(bytesToHex(hexToBytes(hex))).toBe(hex);
      expect(bytesToHex(hexToBytes("AABB"))).toBe("aabb");
    });

    it("rejects odd-length and non-hex input", () => {
      expect(() => hexToBytes("abc")).toThrow(/even length/i);
      expect(() => hexToBytes("zz")).toThrow(/hexadecimal/i);
    });
  });

  describe("isValidEntropyHex", () => {
    it("accepts full BIP39 hex lengths", () => {
      for (const length of BIP39_ENTROPY_HEX_LENGTHS) {
        expect(isValidEntropyHex("a".repeat(length))).toBe(true);
        expect(isValidEntropyHex("A".repeat(length))).toBe(true);
      }
    });

    it("rejects empty, odd, non-hex, and it-tools-capped mid lengths that are invalid BIP39", () => {
      expect(isValidEntropyHex("")).toBe(false);
      expect(isValidEntropyHex("abcd")).toBe(false);
      expect(isValidEntropyHex("a".repeat(16))).toBe(false);
      expect(isValidEntropyHex("a".repeat(20))).toBe(false);
      expect(isValidEntropyHex("a".repeat(28))).toBe(false);
      expect(isValidEntropyHex("a".repeat(36))).toBe(false);
      expect(isValidEntropyHex(`${"a".repeat(31)}g`)).toBe(false);
    });
  });

  describe("generateEntropyHex", () => {
    it("defaults to 128-bit (32 hex chars)", () => {
      const hex = generateEntropyHex();
      expect(hex).toHaveLength(32);
      expect(isValidEntropyHex(hex)).toBe(true);
    });

    it("produces the correct length for every BIP39 strength", () => {
      for (const strength of BIP39_STRENGTHS) {
        const hex = generateEntropyHex(strength);
        expect(hex).toHaveLength(bip39EntropyHexLength(strength));
        expect(isValidEntropyHex(hex)).toBe(true);
      }
    });
  });

  describe("entropy ↔ mnemonic", () => {
    it("matches a known English vector", () => {
      expect(entropyHexToMnemonic(VECTOR_ENTROPY_HEX, "english")).toBe(VECTOR_MNEMONIC);
      expect(mnemonicToEntropyHex(VECTOR_MNEMONIC, "english")).toBe(VECTOR_ENTROPY_HEX);
      expect(isValidMnemonic(VECTOR_MNEMONIC, "english")).toBe(true);
    });

    it("round-trips every strength in English", () => {
      for (const strength of BIP39_STRENGTHS) {
        const hex = generateEntropyHex(strength);
        const mnemonic = entropyHexToMnemonic(hex, "english");
        expect(mnemonic.split(/\s+/)).toHaveLength(bip39WordCount(strength));
        expect(isValidMnemonic(mnemonic, "english")).toBe(true);
        expect(mnemonicToEntropyHex(mnemonic, "english")).toBe(hex);
      }
    });

    it("round-trips across all languages", () => {
      const hex = VECTOR_ENTROPY_HEX;

      for (const { id } of BIP39_LANGUAGES) {
        const mnemonic = entropyHexToMnemonic(hex, id);
        expect(isValidMnemonic(mnemonic, id)).toBe(true);
        expect(mnemonicToEntropyHex(mnemonic, id)).toBe(hex);
      }
    });

    it("uses ideographic space for Japanese mnemonics", () => {
      const mnemonic = entropyHexToMnemonic(VECTOR_ENTROPY_HEX, "japanese");
      expect(mnemonic.includes("\u3000")).toBe(true);
      expect(mnemonic.includes(" ")).toBe(false);
      expect(isValidMnemonic(mnemonic, "japanese")).toBe(true);
      expect(mnemonicToEntropyHex(mnemonic, "japanese")).toBe(VECTOR_ENTROPY_HEX);
    });

    it("rejects invalid entropy and mnemonic", () => {
      expect(() => entropyHexToMnemonic("abcd", "english")).toThrow(/invalid/i);
      expect(() => mnemonicToEntropyHex("not a real mnemonic phrase here", "english")).toThrow(
        /invalid/i,
      );
      expect(isValidMnemonic("", "english")).toBe(false);
      expect(
        isValidMnemonic("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about", "french"),
      ).toBe(false);
    });
  });
});

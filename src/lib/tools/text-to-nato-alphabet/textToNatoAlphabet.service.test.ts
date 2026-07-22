import { describe, expect, it } from "vitest";

import { NATO_ALPHABET, textToNatoAlphabet } from "./textToNatoAlphabet.service";

describe("text-to-nato-alphabet", () => {
  describe("NATO_ALPHABET", () => {
    it("has 26 words Alpha through Zulu", () => {
      expect(NATO_ALPHABET).toHaveLength(26);
      expect(NATO_ALPHABET[0]).toBe("Alpha");
      expect(NATO_ALPHABET[23]).toBe("X-ray");
      expect(NATO_ALPHABET[25]).toBe("Zulu");
    });
  });

  describe("textToNatoAlphabet", () => {
    it("returns an empty string for empty input", () => {
      expect(textToNatoAlphabet("")).toBe("");
    });

    it("maps lowercase and uppercase letters case-insensitively", () => {
      expect(textToNatoAlphabet("a")).toBe("Alpha");
      expect(textToNatoAlphabet("A")).toBe("Alpha");
      expect(textToNatoAlphabet("z")).toBe("Zulu");
      expect(textToNatoAlphabet("Z")).toBe("Zulu");
      expect(textToNatoAlphabet("hello")).toBe("Hotel Echo Lima Lima Oscar");
      expect(textToNatoAlphabet("Hello")).toBe("Hotel Echo Lima Lima Oscar");
    });

    it("passes non-letters through and space-joins every character", () => {
      expect(textToNatoAlphabet("1")).toBe("1");
      expect(textToNatoAlphabet("!")).toBe("!");
      expect(textToNatoAlphabet("a1b")).toBe("Alpha 1 Bravo");
      expect(textToNatoAlphabet("a b")).toBe("Alpha   Bravo");
      expect(textToNatoAlphabet("OK!")).toBe("Oscar Kilo !");
    });

    it("maps the full alphabet in order", () => {
      const input = "abcdefghijklmnopqrstuvwxyz";
      expect(textToNatoAlphabet(input)).toBe(NATO_ALPHABET.join(" "));
    });
  });
});

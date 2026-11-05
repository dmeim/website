import { describe, expect, it } from "vitest";

import {
  MAX_BASE,
  MAX_INPUT_DIGITS,
  MIN_BASE,
  clampBase,
  convertBase,
  convertBaseSafe,
  getBaseError,
  getConvertBaseError,
} from "./baseConverter.service";

describe("base-converter", () => {
  describe("convertBase", () => {
    describe("when the input and target bases are between 2 and 64", () => {
      it("should convert integer between different bases", () => {
        expect(convertBase({ value: "0", fromBase: 2, toBase: 11 })).toEqual(
          "0",
        );
        expect(convertBase({ value: "0", fromBase: 5, toBase: 2 })).toEqual(
          "0",
        );
        expect(convertBase({ value: "0", fromBase: 10, toBase: 16 })).toEqual(
          "0",
        );
        expect(
          convertBase({ value: "10100101", fromBase: 2, toBase: 16 }),
        ).toEqual("a5");
        expect(
          convertBase({ value: "192654", fromBase: 10, toBase: 8 }),
        ).toEqual("570216");
        expect(convertBase({ value: "zz", fromBase: 64, toBase: 10 })).toEqual(
          "2275",
        );
        expect(
          convertBase({
            value: "42540766411283223938465490632011909384",
            fromBase: 10,
            toBase: 10,
          }),
        ).toEqual("42540766411283223938465490632011909384");
        expect(
          convertBase({
            value: "42540766411283223938465490632011909384",
            fromBase: 10,
            toBase: 16,
          }),
        ).toEqual("20010db8000085a300000000ac1f8908");
        expect(
          convertBase({
            value: "20010db8000085a300000000ac1f8908",
            fromBase: 16,
            toBase: 10,
          }),
        ).toEqual("42540766411283223938465490632011909384");
      });
    });

    it("throws on digits outside the source alphabet", () => {
      expect(() =>
        convertBase({ value: "2", fromBase: 2, toBase: 10 }),
      ).toThrow('Invalid digit "2" for base 2.');
      expect(() =>
        convertBase({ value: "g", fromBase: 16, toBase: 10 }),
      ).toThrow('Invalid digit "g" for base 16.');
    });

    it("keeps full precision above 2^53 (vectors from python3 int())", () => {
      expect(convertBase({ value: "9007199254740993", fromBase: 10, toBase: 16 })).toEqual("20000000000001");
      expect(convertBase({ value: "20000000000001", fromBase: 16, toBase: 10 })).toEqual("9007199254740993");
      expect(convertBase({ value: "18446744073709551615", fromBase: 10, toBase: 2 })).toEqual("1".repeat(64));
      expect(convertBase({ value: "18446744073709551615", fromBase: 10, toBase: 64 })).toEqual("f//////////");
      expect(convertBase({ value: "f//////////", fromBase: 64, toBase: 10 })).toEqual("18446744073709551615");
    });

    it("agrees with one-digit-at-a-time arithmetic at every base and length", () => {
      const digits = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";
      const naive = (value: bigint, base: number) => {
        let out = "";
        for (let rest = value; rest > 0n; rest /= BigInt(base)) out = digits[Number(rest % BigInt(base))]! + out;
        return out || "0";
      };
      const samples = [0n, 1n, 41n, 2n ** 53n + 1n, 2n ** 64n - 1n, 10n ** 40n, 10n ** 400n + 7n, 3n ** 1000n];
      for (let base = MIN_BASE; base <= MAX_BASE; base += 1) {
        for (const sample of samples) {
          const encoded = convertBase({ value: sample.toString(), fromBase: 10, toBase: base });
          expect(encoded).toEqual(naive(sample, base));
          expect(convertBase({ value: encoded, fromBase: base, toBase: 10 })).toEqual(sample.toString());
        }
      }
    });

    it("uses the it-tools digit order for bases above 36", () => {
      expect(convertBase({ value: "63", fromBase: 10, toBase: 64 })).toEqual("/");
      expect(convertBase({ value: "62", fromBase: 10, toBase: 64 })).toEqual("+");
      expect(convertBase({ value: "36", fromBase: 10, toBase: 64 })).toEqual("A");
      expect(convertBase({ value: "10", fromBase: 64, toBase: 10 })).toEqual("64");
    });

    it("accepts uppercase digits only where they cannot be ambiguous", () => {
      expect(convertBase({ value: "FF", fromBase: 16, toBase: 10 })).toEqual("255");
      expect(convertBase({ value: "A", fromBase: 64, toBase: 10 })).toEqual("36");
      expect(convertBase({ value: "a", fromBase: 64, toBase: 10 })).toEqual("10");
    });

    it("ignores surrounding whitespace but not inner whitespace", () => {
      expect(convertBase({ value: " 42\n", fromBase: 10, toBase: 2 })).toEqual("101010");
      expect(() => convertBase({ value: "4 2", fromBase: 10, toBase: 2 })).toThrow('Invalid digit " "');
    });

    it("names a whole emoji in the error, not half of a surrogate pair", () => {
      expect(() => convertBase({ value: "😀", fromBase: 10, toBase: 2 })).toThrow('Invalid digit "😀" for base 10.');
    });

    it("refuses input long enough to freeze the page", () => {
      expect(() => convertBase({ value: "1".repeat(MAX_INPUT_DIGITS + 1), fromBase: 10, toBase: 2 })).toThrow("too long");
    });

    it("treats empty input as zero", () => {
      expect(convertBase({ value: "", fromBase: 10, toBase: 16 })).toEqual("0");
    });
  });

  describe("getBaseError", () => {
    it("accepts 2 through 64 and explains anything else", () => {
      expect(getBaseError("Input base", 2)).toBeNull();
      expect(getBaseError("Input base", 64)).toBeNull();
      for (const base of [1, 65, 2.5, Number.NaN]) {
        expect(getBaseError("Input base", base)).toBe("Input base must be a whole number from 2 to 64.");
      }
    });
  });

  describe("convertBaseSafe / getConvertBaseError", () => {
    it("returns empty string and an error message for invalid digits", () => {
      expect(
        convertBaseSafe({ value: "2", fromBase: 2, toBase: 10 }),
      ).toEqual("");
      expect(
        getConvertBaseError({ value: "2", fromBase: 2, toBase: 10 }),
      ).toEqual('Invalid digit "2" for base 2.');
    });

    it("returns the conversion and null error when valid", () => {
      expect(
        convertBaseSafe({ value: "42", fromBase: 10, toBase: 16 }),
      ).toEqual("2a");
      expect(
        getConvertBaseError({ value: "42", fromBase: 10, toBase: 16 }),
      ).toBeNull();
    });
  });

  describe("clampBase", () => {
    it("exposes the same base bounds as it-tools", () => {
      expect(MIN_BASE).toBe(2);
      expect(MAX_BASE).toBe(64);
    });

    it("clamps into 2–64 and falls back for non-finite values", () => {
      expect(clampBase(1, 10)).toBe(2);
      expect(clampBase(100, 10)).toBe(64);
      expect(clampBase(16.9, 10)).toBe(16);
      expect(clampBase(Number.NaN, 10)).toBe(10);
    });
  });
});

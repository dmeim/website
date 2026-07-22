import { describe, expect, it } from "vitest";

import {
  MAX_ARABIC_TO_ROMAN,
  MIN_ARABIC_TO_ROMAN,
  arabicToRoman,
  isValidRomanNumber,
  romanToArabic,
} from "./romanNumeralConverter.service";

describe("roman-numeral-converter", () => {
  describe("arabicToRoman", () => {
    it("converts numbers lower than 1 to empty string", () => {
      expect(arabicToRoman(-100)).toEqual("");
      expect(arabicToRoman(-42)).toEqual("");
      expect(arabicToRoman(-26)).toEqual("");
      expect(arabicToRoman(-10)).toEqual("");
      expect(arabicToRoman(0)).toEqual("");
      expect(arabicToRoman(0.5)).toEqual("");
      expect(arabicToRoman(0.9)).toEqual("");
    });

    it("converts numbers greater than 3999 to empty string", () => {
      expect(arabicToRoman(3999.1)).toEqual("");
      expect(arabicToRoman(4000)).toEqual("");
      expect(arabicToRoman(10000)).toEqual("");
    });

    it("converts floating points number to the lower integer in roman version", () => {
      expect(arabicToRoman(1.1)).toEqual("I");
      expect(arabicToRoman(1.9)).toEqual("I");
      expect(arabicToRoman(17.6)).toEqual("XVII");
      expect(arabicToRoman(29.999)).toEqual("XXIX");
    });

    it("converts positive integers to roman numbers", () => {
      expect(arabicToRoman(1)).toEqual("I");
      expect(arabicToRoman(2)).toEqual("II");
      expect(arabicToRoman(3)).toEqual("III");
      expect(arabicToRoman(4)).toEqual("IV");
      expect(arabicToRoman(5)).toEqual("V");
      expect(arabicToRoman(6)).toEqual("VI");
      expect(arabicToRoman(7)).toEqual("VII");
      expect(arabicToRoman(8)).toEqual("VIII");
      expect(arabicToRoman(9)).toEqual("IX");
      expect(arabicToRoman(10)).toEqual("X");
      expect(arabicToRoman(11)).toEqual("XI");
      expect(arabicToRoman(12)).toEqual("XII");
      expect(arabicToRoman(13)).toEqual("XIII");
      expect(arabicToRoman(14)).toEqual("XIV");
      expect(arabicToRoman(15)).toEqual("XV");
      expect(arabicToRoman(16)).toEqual("XVI");
      expect(arabicToRoman(17)).toEqual("XVII");
      expect(arabicToRoman(18)).toEqual("XVIII");
      expect(arabicToRoman(19)).toEqual("XIX");
      expect(arabicToRoman(20)).toEqual("XX");
      expect(arabicToRoman(21)).toEqual("XXI");
      expect(arabicToRoman(24)).toEqual("XXIV");
      expect(arabicToRoman(28)).toEqual("XXVIII");
      expect(arabicToRoman(29)).toEqual("XXIX");
      expect(arabicToRoman(30)).toEqual("XXX");
      expect(arabicToRoman(40)).toEqual("XL");
      expect(arabicToRoman(42)).toEqual("XLII");
      expect(arabicToRoman(50)).toEqual("L");
      expect(arabicToRoman(60)).toEqual("LX");
      expect(arabicToRoman(70)).toEqual("LXX");
      expect(arabicToRoman(80)).toEqual("LXXX");
      expect(arabicToRoman(90)).toEqual("XC");
      expect(arabicToRoman(100)).toEqual("C");
      expect(arabicToRoman(200)).toEqual("CC");
      expect(arabicToRoman(300)).toEqual("CCC");
      expect(arabicToRoman(400)).toEqual("CD");
      expect(arabicToRoman(500)).toEqual("D");
      expect(arabicToRoman(600)).toEqual("DC");
      expect(arabicToRoman(700)).toEqual("DCC");
      expect(arabicToRoman(800)).toEqual("DCCC");
      expect(arabicToRoman(900)).toEqual("CM");
      expect(arabicToRoman(999)).toEqual("CMXCIX");
      expect(arabicToRoman(1000)).toEqual("M");
      expect(arabicToRoman(2000)).toEqual("MM");
      expect(arabicToRoman(3999)).toEqual("MMMCMXCIX");
    });
  });

  describe("isValidRomanNumber / romanToArabic", () => {
    it("accepts classic roman forms and rejects invalid ones", () => {
      expect(isValidRomanNumber("")).toBe(true);
      expect(isValidRomanNumber("XLII")).toBe(true);
      expect(isValidRomanNumber("MMMCMXCIX")).toBe(true);
      expect(isValidRomanNumber("IIII")).toBe(false);
      expect(isValidRomanNumber("IC")).toBe(false);
      expect(isValidRomanNumber("xlii")).toBe(false);
      expect(isValidRomanNumber("ABC")).toBe(false);
    });

    it("converts valid roman numerals to arabic", () => {
      expect(romanToArabic("")).toBe(0);
      expect(romanToArabic("I")).toBe(1);
      expect(romanToArabic("IV")).toBe(4);
      expect(romanToArabic("IX")).toBe(9);
      expect(romanToArabic("XLII")).toBe(42);
      expect(romanToArabic("CMXCIX")).toBe(999);
      expect(romanToArabic("MMMCMXCIX")).toBe(3999);
    });

    it("returns null for invalid roman input", () => {
      expect(romanToArabic("IIII")).toBeNull();
      expect(romanToArabic("xlii")).toBeNull();
      expect(romanToArabic("IC")).toBeNull();
    });
  });

  describe("round-trip and bounds", () => {
    it("exposes the same arabic bounds as it-tools", () => {
      expect(MIN_ARABIC_TO_ROMAN).toBe(1);
      expect(MAX_ARABIC_TO_ROMAN).toBe(3999);
    });

    it("round-trips integers in range", () => {
      for (const n of [1, 4, 9, 42, 399, 1994, 3999]) {
        expect(romanToArabic(arabicToRoman(n))).toBe(n);
      }
    });
  });
});

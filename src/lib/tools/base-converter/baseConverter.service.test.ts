import { describe, expect, it } from "vitest";

import {
  MAX_BASE,
  MIN_BASE,
  clampBase,
  convertBase,
  convertBaseSafe,
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

    it("treats empty input as zero", () => {
      expect(convertBase({ value: "", fromBase: 10, toBase: 16 })).toEqual("0");
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

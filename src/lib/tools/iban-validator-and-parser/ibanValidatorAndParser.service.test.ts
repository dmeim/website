import { describe, expect, it } from "vitest";
import { ValidationErrorsIBAN } from "ibantools";

import {
  IBAN_EXAMPLES,
  formatIbanFriendly,
  getFriendlyErrors,
  normalizeIban,
  parseIban,
} from "./ibanValidatorAndParser.service";

describe("iban-validator-and-parser", () => {
  describe("normalizeIban", () => {
    it("uppercases and strips spaces and dashes", () => {
      expect(normalizeIban(" de89-3704 0044-0532 0130 00 ")).toBe(
        "DE89370400440532013000",
      );
    });

    it("returns empty string for blank input", () => {
      expect(normalizeIban("")).toBe("");
      expect(normalizeIban("   ")).toBe("");
    });
  });

  describe("getFriendlyErrors", () => {
    it("maps known error codes to messages", () => {
      expect(
        getFriendlyErrors([
          ValidationErrorsIBAN.WrongAccountBankBranchChecksum,
          ValidationErrorsIBAN.WrongIBANChecksum,
        ]),
      ).toEqual([
        "Wrong account bank branch checksum",
        "Wrong IBAN checksum",
      ]);
    });

    it("returns empty for no errors", () => {
      expect(getFriendlyErrors([])).toEqual([]);
    });
  });

  describe("parseIban", () => {
    it("returns undefined for empty input", () => {
      expect(parseIban("")).toBeUndefined();
      expect(parseIban("   ")).toBeUndefined();
    });

    it("extracts info from a valid German IBAN", () => {
      expect(parseIban("DE89370400440532013000")).toEqual({
        isValid: true,
        errors: [],
        isQrIban: false,
        countryCode: "DE",
        bban: "370400440532013000",
        friendlyFormat: "DE89 3704 0044 0532 0130 00",
      });
    });

    it("reports errors for an invalid French IBAN", () => {
      expect(parseIban("FR7630006060011234567890189")).toEqual({
        isValid: false,
        errors: [
          "Wrong account bank branch checksum",
          "Wrong IBAN checksum",
        ],
        isQrIban: false,
        countryCode: undefined,
        bban: undefined,
        friendlyFormat: "FR76 3000 6060 0112 3456 7890 189",
      });
    });

    it("accepts spaced / dashed input for a valid IBAN", () => {
      const info = parseIban("DE89 3704-0044 0532 0130 00");
      expect(info?.isValid).toBe(true);
      expect(info?.countryCode).toBe("DE");
      expect(info?.friendlyFormat).toBe("DE89 3704 0044 0532 0130 00");
    });

    it("parses all example IBANs as valid", () => {
      for (const example of IBAN_EXAMPLES) {
        const info = parseIban(example);
        expect(info?.isValid, example).toBe(true);
        expect(info?.errors, example).toEqual([]);
        expect(info?.countryCode, example).toBeTruthy();
        expect(info?.bban, example).toBeTruthy();
      }
    });
  });

  describe("formatIbanFriendly", () => {
    it("formats example IBANs with spaces", () => {
      expect(formatIbanFriendly(IBAN_EXAMPLES[1])).toBe(
        "DE89 3704 0044 0532 0130 00",
      );
    });

    it("returns empty for blank input", () => {
      expect(formatIbanFriendly("")).toBe("");
    });
  });
});

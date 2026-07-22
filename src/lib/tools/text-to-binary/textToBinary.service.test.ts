import { describe, expect, it } from "vitest";

import {
  convertAsciiBinaryToText,
  convertAsciiBinaryToTextSafe,
  convertTextToAsciiBinary,
  isValidAsciiBinary,
} from "./textToBinary.service";

describe("text-to-binary", () => {
  describe("convertTextToAsciiBinary", () => {
    it("converts a text string to its ascii binary representation", () => {
      expect(convertTextToAsciiBinary("A")).toBe("01000001");
      expect(convertTextToAsciiBinary("hello")).toBe(
        "01101000 01100101 01101100 01101100 01101111",
      );
      expect(convertTextToAsciiBinary("")).toBe("");
    });

    it("allows changing the separator between octets", () => {
      expect(convertTextToAsciiBinary("hello", { separator: "" })).toBe(
        "0110100001100101011011000110110001101111",
      );
    });

    it("encodes spaces and punctuation as octets", () => {
      expect(convertTextToAsciiBinary(" ")).toBe("00100000");
      expect(convertTextToAsciiBinary("!")).toBe("00100001");
    });
  });

  describe("convertAsciiBinaryToText", () => {
    it("converts an ascii binary string to its text representation", () => {
      expect(
        convertAsciiBinaryToText(
          "01101000 01100101 01101100 01101100 01101111",
        ),
      ).toBe("hello");
      expect(convertAsciiBinaryToText("01000001")).toBe("A");
      expect(convertAsciiBinaryToText("")).toBe("");
    });

    it("cleans non-binary characters before conversion", () => {
      expect(convertAsciiBinaryToText("  01000 001garbage")).toBe("A");
    });

    it("throws when the binary string has no complete octet", () => {
      expect(() => convertAsciiBinaryToText("010000011")).toThrow(
        "Invalid binary string",
      );
      expect(() => convertAsciiBinaryToText("1")).toThrow(
        "Invalid binary string",
      );
    });
  });

  describe("isValidAsciiBinary / convertAsciiBinaryToTextSafe", () => {
    it("reports validity for complete and incomplete octets", () => {
      expect(isValidAsciiBinary("01000001")).toBe(true);
      expect(isValidAsciiBinary("")).toBe(true);
      expect(isValidAsciiBinary("1")).toBe(false);
      expect(isValidAsciiBinary("010000011")).toBe(false);
    });

    it("returns empty string on invalid input without throwing", () => {
      expect(convertAsciiBinaryToTextSafe("1")).toBe("");
      expect(convertAsciiBinaryToTextSafe("01000001")).toBe("A");
    });
  });

  describe("round-trip", () => {
    it("round-trips ASCII text through binary", () => {
      const sample = "it-tools";
      expect(
        convertAsciiBinaryToText(convertTextToAsciiBinary(sample)),
      ).toBe(sample);
    });
  });
});

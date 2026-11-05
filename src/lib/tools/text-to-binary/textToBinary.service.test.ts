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
    it("encodes non-ASCII as UTF-8 octets (vectors from python3 str.encode)", () => {
      expect(convertTextToAsciiBinary("é")).toBe("11000011 10101001");
      expect(convertTextToAsciiBinary("😀")).toBe("11110000 10011111 10011000 10000000");
      expect(convertAsciiBinaryToText("11000011 10101001")).toBe("é");
      expect(convertAsciiBinaryToText("11110000 10011111 10011000 10000000")).toBe("😀");
    });

    it("round-trips any Unicode text", () => {
      for (const text of ["😀", "日本語 👩‍💻 𝒳 é", "\uFEFFbom", "\u0000"]) {
        expect(convertAsciiBinaryToText(convertTextToAsciiBinary(text))).toBe(text);
      }
    });

    it("still reads Latin-1 octets that are not valid UTF-8", () => {
      expect(convertAsciiBinaryToText("11101001")).toBe("é");
    });

    it("handles a long Latin-1 string without overflowing the call stack", () => {
      expect(convertAsciiBinaryToText("11101001".repeat(200_000))).toBe("é".repeat(200_000));
    });

    it("rejects text with no binary digits instead of showing nothing", () => {
      expect(isValidAsciiBinary("hello")).toBe(false);
      expect(isValidAsciiBinary("   ")).toBe(true);
      expect(isValidAsciiBinary("")).toBe(true);
    });

    it("round-trips ASCII text through binary", () => {
      const sample = "it-tools";
      expect(
        convertAsciiBinaryToText(convertTextToAsciiBinary(sample)),
      ).toBe(sample);
    });
  });
});

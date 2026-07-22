import { describe, expect, it } from "vitest";

import {
  base64ToText,
  base64ToTextSafe,
  isValidBase64,
  removePotentialDataAndMimePrefix,
  textToBase64,
} from "./base64StringConverter.service";

describe("base64-string-converter", () => {
  describe("textToBase64", () => {
    it("converts string into base64", () => {
      expect(textToBase64("")).toBe("");
      expect(textToBase64("a")).toBe("YQ==");
      expect(textToBase64("lorem ipsum")).toBe("bG9yZW0gaXBzdW0=");
      expect(textToBase64("-1")).toBe("LTE=");
      expect(textToBase64("<<<????????>>>", { makeUrlSafe: false })).toBe(
        "PDw8Pz8/Pz8/Pz8+Pj4=",
      );
    });

    it("converts string into url-safe base64", () => {
      expect(textToBase64("", { makeUrlSafe: true })).toBe("");
      expect(textToBase64("a", { makeUrlSafe: true })).toBe("YQ");
      expect(textToBase64("lorem ipsum", { makeUrlSafe: true })).toBe(
        "bG9yZW0gaXBzdW0",
      );
      expect(textToBase64("<<<????????>>>", { makeUrlSafe: true })).toBe(
        "PDw8Pz8_Pz8_Pz8-Pj4",
      );
    });

    it("encodes non-ASCII as UTF-8", () => {
      expect(textToBase64("é")).toBe("w6k=");
      expect(textToBase64("你好")).toBe("5L2g5aW9");
    });
  });

  describe("base64ToText", () => {
    it("converts base64 into text", () => {
      expect(base64ToText("")).toBe("");
      expect(base64ToText("YQ==", { makeUrlSafe: false })).toBe("a");
      expect(base64ToText("bG9yZW0gaXBzdW0=")).toBe("lorem ipsum");
      expect(base64ToText("data:text/plain;base64,bG9yZW0gaXBzdW0=")).toBe(
        "lorem ipsum",
      );
      expect(base64ToText("LTE=")).toBe("-1");
    });

    it("converts url-safe base64 into text", () => {
      expect(base64ToText("", { makeUrlSafe: true })).toBe("");
      expect(base64ToText("YQ", { makeUrlSafe: true })).toBe("a");
      expect(base64ToText("bG9yZW0gaXBzdW0", { makeUrlSafe: true })).toBe(
        "lorem ipsum",
      );
      expect(
        base64ToText("data:text/plain;base64,bG9yZW0gaXBzdW0", {
          makeUrlSafe: true,
        }),
      ).toBe("lorem ipsum");
      expect(base64ToText("LTE", { makeUrlSafe: true })).toBe("-1");
      expect(base64ToText("PDw8Pz8_Pz8_Pz8-Pj4", { makeUrlSafe: true })).toBe(
        "<<<????????>>>",
      );
    });

    it("throws for incorrect base64 string", () => {
      expect(() => base64ToText("a")).toThrow("Incorrect base64 string");
      expect(() => base64ToText("é")).toThrow("Incorrect base64 string");
      // missing final '='
      expect(() => base64ToText("bG9yZW0gaXBzdW0")).toThrow(
        "Incorrect base64 string",
      );
    });
  });

  describe("isValidBase64", () => {
    it("returns true for correct base64 string", () => {
      expect(isValidBase64("")).toBe(true);
      expect(isValidBase64("bG9yZW0gaXBzdW0=")).toBe(true);
      expect(isValidBase64("LTE=")).toBe(true);
      expect(isValidBase64("YQ==")).toBe(true);
      expect(isValidBase64("data:text/plain;base64,YQ==")).toBe(true);
    });

    it("returns false for incorrect base64 string", () => {
      expect(isValidBase64("a")).toBe(false);
      expect(isValidBase64("é")).toBe(false);
      expect(isValidBase64("data:text/plain;notbase64,YQ==")).toBe(false);
      // missing final '='
      expect(isValidBase64("bG9yZW0gaXBzdW0")).toBe(false);
    });

    it("returns true for untrimmed correct base64 string", () => {
      expect(isValidBase64("bG9yZW0gaXBzdW0= ")).toBe(true);
      expect(isValidBase64(" LTE=")).toBe(true);
      expect(isValidBase64(" YQ== ")).toBe(true);
      expect(isValidBase64(" ")).toBe(true);
    });
  });

  describe("removePotentialDataAndMimePrefix", () => {
    it("removes data prefix of string", () => {
      expect(removePotentialDataAndMimePrefix("")).toBe("");
      expect(removePotentialDataAndMimePrefix("lorem ipsum")).toBe(
        "lorem ipsum",
      );
      expect(removePotentialDataAndMimePrefix("bG9yZW0gaXBzdW0=")).toBe(
        "bG9yZW0gaXBzdW0=",
      );
      expect(removePotentialDataAndMimePrefix("data:image/jpeg;base64,lorem")).toBe(
        "lorem",
      );
      expect(
        removePotentialDataAndMimePrefix("data:image/jpeg;notbase64,lorem"),
      ).toBe("data:image/jpeg;notbase64,lorem");
      expect(
        removePotentialDataAndMimePrefix("data:unknownmime;base64,lorem"),
      ).toBe("lorem");
    });
  });

  describe("base64ToTextSafe / round-trip", () => {
    it("returns empty string on invalid input without throwing", () => {
      expect(base64ToTextSafe("a")).toBe("");
      expect(base64ToTextSafe("YQ==")).toBe("a");
    });

    it("round-trips text through base64", () => {
      const sample = "it-tools ← UTF-8";
      expect(base64ToText(textToBase64(sample))).toBe(sample);
      expect(
        base64ToText(textToBase64(sample, { makeUrlSafe: true }), {
          makeUrlSafe: true,
        }),
      ).toBe(sample);
    });
  });
});

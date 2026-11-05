import { describe, expect, it } from "vitest";

import { generateNumeronym } from "./numeronymGenerator.service";

describe("numeronym-generator", () => {
  describe("generateNumeronym", () => {
    it("uses first letter, middle letter count, and last letter", () => {
      expect(generateNumeronym("internationalization")).toBe("i18n");
      expect(generateNumeronym("accessibility")).toBe("a11y");
      expect(generateNumeronym("localization")).toBe("l10n");
    });

    it("returns short words unchanged", () => {
      expect(generateNumeronym("abc")).toBe("abc");
      expect(generateNumeronym("ab")).toBe("ab");
      expect(generateNumeronym("a")).toBe("a");
      expect(generateNumeronym("")).toBe("");
    });

    it("counts emoji and combining characters as one letter", () => {
      expect(generateNumeronym("😀bcd😀")).toBe("😀3😀");
      expect(generateNumeronym("a😀😀b")).toBe("a2b");
      expect(generateNumeronym("😀😀😀")).toBe("😀😀😀");
      expect(generateNumeronym("e\u0301abce\u0301")).toBe("e\u03013e\u0301");
      expect(generateNumeronym("👨‍👩‍👧‍👦abc👍🏽")).toBe("👨‍👩‍👧‍👦3👍🏽");
    });

    it("ignores surrounding whitespace", () => {
      expect(generateNumeronym("  internationalization ")).toBe("i18n");
      expect(generateNumeronym("   ")).toBe("");
    });

    it("handles a four-letter word", () => {
      expect(generateNumeronym("test")).toBe("t2t");
    });
  });
});

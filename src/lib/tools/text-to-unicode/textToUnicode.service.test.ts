import { describe, expect, it } from "vitest";

import { convertTextToUnicode, convertUnicodeToText } from "./textToUnicode.service";

describe("text-to-unicode", () => {
  describe("convertTextToUnicode", () => {
    it("converts a text string to unicode representation", () => {
      expect(convertTextToUnicode("A")).toBe("&#65;");
      expect(convertTextToUnicode("linke the string convert to unicode")).toBe(
        "&#108;&#105;&#110;&#107;&#101;&#32;&#116;&#104;&#101;&#32;&#115;&#116;&#114;&#105;&#110;&#103;&#32;&#99;&#111;&#110;&#118;&#101;&#114;&#116;&#32;&#116;&#111;&#32;&#117;&#110;&#105;&#99;&#111;&#100;&#101;",
      );
      expect(convertTextToUnicode("")).toBe("");
    });

    it("encodes spaces, punctuation, and digits", () => {
      expect(convertTextToUnicode(" ")).toBe("&#32;");
      expect(convertTextToUnicode("!")).toBe("&#33;");
      expect(convertTextToUnicode("9")).toBe("&#57;");
    });
  });

  describe("convertUnicodeToText", () => {
    it("converts an unicode string to its text representation", () => {
      expect(convertUnicodeToText("&#65;")).toBe("A");
      expect(
        convertUnicodeToText(
          "&#108;&#105;&#110;&#107;&#101;&#32;&#116;&#104;&#101;&#32;&#115;&#116;&#114;&#105;&#110;&#103;&#32;&#99;&#111;&#110;&#118;&#101;&#114;&#116;&#32;&#116;&#111;&#32;&#117;&#110;&#105;&#99;&#111;&#100;&#101;",
        ),
      ).toBe("linke the string convert to unicode");
      expect(convertUnicodeToText("")).toBe("");
    });

    it("leaves non-entity text unchanged", () => {
      expect(convertUnicodeToText("hello")).toBe("hello");
      expect(convertUnicodeToText("A&#65;B")).toBe("AAB");
    });
  });

  describe("round-trip", () => {
    it("round-trips ASCII text through entities", () => {
      const sample = "Hello Avengers!";
      expect(convertUnicodeToText(convertTextToUnicode(sample))).toBe(sample);
    });
  });
});

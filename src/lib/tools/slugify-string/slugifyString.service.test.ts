import { describe, expect, it } from "vitest";

import { slugifyString } from "./slugifyString.service";

describe("slugify-string", () => {
  describe("slugifyString", () => {
    it("returns an empty string for empty input", () => {
      expect(slugifyString("")).toBe("");
    });

    it("slugifies a basic path-like string", () => {
      expect(slugifyString("My file path")).toBe("my-file-path");
    });

    it("lowercases and strips punctuation", () => {
      expect(slugifyString("  Déjà Vu!  ")).toBe("deja-vu");
    });

    it("decamelizes camelCase", () => {
      expect(slugifyString("fooBar 123 $#%")).toBe("foo-bar-123");
    });

    it("applies built-in replacements for & and ♥", () => {
      expect(slugifyString("I ♥ Dogs")).toBe("i-love-dogs");
      expect(slugifyString("Cats & Dogs")).toBe("cats-and-dogs");
    });

    it("transliterates non-Latin scripts", () => {
      expect(slugifyString("я люблю единорогов")).toBe("ya-lyublyu-edinorogov");
    });

    it("collapses separators and trims edges", () => {
      expect(slugifyString("---hello---world---")).toBe("hello-world");
      expect(slugifyString("a   b")).toBe("a-b");
    });
  });
});

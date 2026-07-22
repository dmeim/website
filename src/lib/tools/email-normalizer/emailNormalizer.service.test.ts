import { describe, expect, it } from "vitest";

import {
  DEFAULT_RAW_EMAILS,
  PARSE_ERROR_PREFIX,
  normalizeEmailLine,
  normalizeEmails,
} from "./emailNormalizer.service";

describe("email-normalizer", () => {
  describe("normalizeEmailLine", () => {
    it("lowercases and trims generic domains without provider rules", () => {
      expect(normalizeEmailLine("  User.Name@Example.COM  ")).toBe(
        "user.name@example.com",
      );
    });

    it("applies Gmail rules: remove dots, strip plus, keep gmail.com", () => {
      expect(normalizeEmailLine("John.Doe+tag@Gmail.com")).toBe(
        "johndoe@gmail.com",
      );
    });

    it("rewrites googlemail.com to gmail.com with Gmail rules", () => {
      expect(normalizeEmailLine("a.b+c@googlemail.com")).toBe("ab@gmail.com");
    });

    it("strips plus on hotmail/outlook without removing dots", () => {
      expect(normalizeEmailLine("u.ser+tag@hotmail.com")).toBe(
        "u.ser@hotmail.com",
      );
      expect(normalizeEmailLine("u.ser+tag@outlook.com")).toBe(
        "u.ser@outlook.com",
      );
    });

    it("removes dots and strips plus on live.com", () => {
      expect(normalizeEmailLine("u.s.er+x@live.com")).toBe("user@live.com");
    });

    it("returns Unable to parse email prefix for invalid input", () => {
      expect(normalizeEmailLine("")).toBe(`${PARSE_ERROR_PREFIX}`);
      expect(normalizeEmailLine("not-an-email")).toBe(
        `${PARSE_ERROR_PREFIX}not-an-email`,
      );
      expect(normalizeEmailLine("foo@bar")).toBe(
        `${PARSE_ERROR_PREFIX}foo@bar`,
      );
    });
  });

  describe("normalizeEmails", () => {
    it("returns empty string for empty input", () => {
      expect(normalizeEmails(DEFAULT_RAW_EMAILS)).toBe("");
      expect(normalizeEmails("")).toBe("");
    });

    it("normalizes one email per line", () => {
      expect(
        normalizeEmails(
          "John.Doe+tag@Gmail.com\na.b+c@googlemail.com\nUser@Example.com",
        ),
      ).toBe("johndoe@gmail.com\nab@gmail.com\nuser@example.com");
    });

    it("preserves line count including invalid and blank lines", () => {
      expect(normalizeEmails("ok@example.com\n\nbad")).toBe(
        `ok@example.com\n${PARSE_ERROR_PREFIX}\n${PARSE_ERROR_PREFIX}bad`,
      );
    });
  });
});

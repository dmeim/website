import { describe, expect, it } from "vitest";

import {
  DEFAULT_INDENT_SIZE,
  clampIndentSize,
  formatYaml,
  getYamlError,
  isValidYaml,
} from "./yamlPrettify.service";

describe("yaml-prettify", () => {
  describe("clampIndentSize", () => {
    it("clamps to 1–10 and truncates", () => {
      expect(clampIndentSize(0)).toBe(1);
      expect(clampIndentSize(-1)).toBe(1);
      expect(clampIndentSize(1)).toBe(1);
      expect(clampIndentSize(2.9)).toBe(2);
      expect(clampIndentSize(10)).toBe(10);
      expect(clampIndentSize(99)).toBe(10);
      expect(clampIndentSize(Number.NaN)).toBe(DEFAULT_INDENT_SIZE);
    });
  });

  describe("formatYaml", () => {
    it("prettifies with default indent and unsorted keys", () => {
      expect(
        formatYaml({
          rawYaml: "hello: world\nfoo: bar\nz: 1\na: 2",
        }),
      ).toBe("hello: world\nfoo: bar\nz: 1\na: 2\n");
    });

    it("sorts map entries when sortKeys is true", () => {
      expect(
        formatYaml({
          rawYaml: "hello: world\nfoo: bar\nz: 1\na: 2",
          sortKeys: true,
          indentSize: 2,
        }),
      ).toBe("a: 2\nfoo: bar\nhello: world\nz: 1\n");
    });

    it("applies indent size to nested maps", () => {
      expect(
        formatYaml({
          rawYaml: "a:\n  b: 1",
          sortKeys: false,
          indentSize: 4,
        }),
      ).toBe("a:\n    b: 1\n");
    });

    it("normalizes compact single-line YAML", () => {
      expect(
        formatYaml({
          rawYaml: "{hello: world, foo: bar}",
          sortKeys: false,
          indentSize: 2,
        }),
      ).toBe("hello: world\nfoo: bar\n");
    });

    it("returns nothing for blank or comment-only input", () => {
      expect(formatYaml({ rawYaml: "" })).toBe("");
      expect(formatYaml({ rawYaml: "  \n" })).toBe("");
      expect(formatYaml({ rawYaml: "# only a comment" })).toBe("");
    });

    it("keeps multiple documents apart", () => {
      expect(formatYaml({ rawYaml: "b: 1\na: 2\n---\n- x\n", sortKeys: true })).toBe("a: 2\nb: 1\n---\n- x\n");
    });

    it("sorts nested maps and leaves sequence order alone", () => {
      expect(formatYaml({ rawYaml: "z:\n  b: 1\n  a: [2, 1]\na: 0", sortKeys: true })).toBe(
        "a: 0\nz:\n  a:\n    - 2\n    - 1\n  b: 1\n",
      );
    });

    it("keeps unicode", () => {
      expect(formatYaml({ rawYaml: "é: 😀" })).toBe("é: 😀\n");
    });

    it("returns empty string for invalid input", () => {
      expect(formatYaml({ rawYaml: ":\nbad" })).toBe("");
      expect(formatYaml({ rawYaml: "not: [unterminated" })).toBe("");
    });
  });

  describe("getYamlError", () => {
    it("returns null for blank and valid input", () => {
      expect(getYamlError("")).toBeNull();
      expect(getYamlError("a: 1\n---\nb: 2")).toBeNull();
    });

    it("explains syntax errors with their position", () => {
      expect(getYamlError("a: 1\na: 2")).toBe(
        "Provided YAML is not valid: Map keys must be unique at line 2, column 1.",
      );
    });
  });

  describe("isValidYaml", () => {
    it("accepts empty and valid YAML", () => {
      expect(isValidYaml("")).toBe(true);
      expect(isValidYaml("a: 1")).toBe(true);
      expect(isValidYaml("hello: world\nfoo: bar")).toBe(true);
      expect(isValidYaml("- one\n- two")).toBe(true);
    });

    it("rejects invalid YAML", () => {
      expect(isValidYaml(":\nbad")).toBe(false);
      expect(isValidYaml("not: [unterminated")).toBe(false);
    });
  });
});

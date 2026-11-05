import { describe, expect, it } from "vitest";

import {
  DEFAULT_CONVERT_OPTIONS,
  convertList,
  isConvertOptions,
  type ConvertOptions,
} from "./listConverter.service";

describe("list-converter", () => {
  describe("convertList", () => {
    it("should convert a given list", () => {
      const options: ConvertOptions = {
        separator: ", ",
        trimItems: true,
        removeDuplicates: true,
        itemPrefix: '"',
        itemSuffix: '"',
        listPrefix: "",
        listSuffix: "",
        reverseList: false,
        sortList: null,
        lowerCase: false,
        keepLineBreaks: false,
      };
      const input = `
        1
        2
        
        3
        3
        4
        `;
      expect(convertList(input, options)).toEqual('"1", "2", "3", "4"');
    });

    it("should return an empty value for an empty input", () => {
      const options: ConvertOptions = {
        separator: ", ",
        trimItems: true,
        removeDuplicates: true,
        itemPrefix: "",
        itemSuffix: "",
        listPrefix: "",
        listSuffix: "",
        reverseList: false,
        sortList: null,
        lowerCase: false,
        keepLineBreaks: false,
      };
      expect(convertList("", options)).toEqual("");
    });

    it("should keep line breaks", () => {
      const options: ConvertOptions = {
        separator: "",
        trimItems: true,
        itemPrefix: "<li>",
        itemSuffix: "</li>",
        listPrefix: "<ul>",
        listSuffix: "</ul>",
        keepLineBreaks: true,
        lowerCase: false,
        removeDuplicates: false,
        reverseList: false,
        sortList: null,
      };
      const input = `
        1
        2
        3
        `;
      const expected = `<ul>
<li>1</li>
<li>2</li>
<li>3</li>
</ul>`;
      expect(convertList(input, options)).toEqual(expected);
    });

    it("applies default options like it-tools (trim + dedupe + comma join)", () => {
      const input = `1
    2
    3
    4
    5`;
      expect(convertList(input, DEFAULT_CONVERT_OPTIONS)).toEqual(
        "1, 2, 3, 4, 5",
      );
    });

    it("dedupes after trim, so spacing cannot hide a duplicate", () => {
      const options: ConvertOptions = {
        ...DEFAULT_CONVERT_OPTIONS,
        removeDuplicates: true,
        trimItems: true,
      };
      expect(convertList("1 \n1\n1 ", options)).toEqual("1");
    });

    it("sorts on the trimmed text, so indentation cannot reorder items", () => {
      expect(convertList("  z\na", { ...DEFAULT_CONVERT_OPTIONS, sortList: "asc" })).toEqual("a, z");
    });

    it("handles Windows line endings with trimming off", () => {
      expect(convertList("a\r\nb", { ...DEFAULT_CONVERT_OPTIONS, trimItems: false })).toEqual("a, b");
    });

    it("keeps inner spacing when trimming is off", () => {
      expect(convertList("  a\n a", { ...DEFAULT_CONVERT_OPTIONS, trimItems: false })).toEqual("  a,  a");
    });

    it("stays empty with no items, even with line breaks and wrappers on", () => {
      const options = { ...DEFAULT_CONVERT_OPTIONS, keepLineBreaks: true, listPrefix: "<ul>", listSuffix: "</ul>" };
      expect(convertList("", options)).toEqual("");
      expect(convertList("  \n ", options)).toEqual("");
    });

    it("adds no stray blank lines when line breaks are on and there is no wrapper", () => {
      expect(convertList("a\nb", { ...DEFAULT_CONVERT_OPTIONS, keepLineBreaks: true, separator: "," })).toEqual("a,\nb");
    });

    it("matches the it-tools e2e vectors", () => {
      expect(convertList("1\n    2\n    3\n    4\n    5", DEFAULT_CONVERT_OPTIONS)).toEqual("1, 2, 3, 4, 5");
      expect(
        convertList("1\n    2\n    2\n    4\n    4\n    3\n    5", { ...DEFAULT_CONVERT_OPTIONS, itemPrefix: "'", itemSuffix: "'" }),
      ).toEqual("'1', '2', '4', '3', '5'");
    });

    it("accepts remembered settings only in the current shape", () => {
      expect(isConvertOptions(DEFAULT_CONVERT_OPTIONS)).toBe(true);
      expect(isConvertOptions({ ...DEFAULT_CONVERT_OPTIONS, sortList: "asc" })).toBe(true);
      expect(isConvertOptions({ ...DEFAULT_CONVERT_OPTIONS, sortList: "up" as never })).toBe(false);
      expect(isConvertOptions({ ...DEFAULT_CONVERT_OPTIONS, separator: 1 as never })).toBe(false);
      expect(isConvertOptions({ lowerCase: true } as never)).toBe(false);
    });

    it("lowercases the whole text before splitting", () => {
      const options: ConvertOptions = {
        ...DEFAULT_CONVERT_OPTIONS,
        lowerCase: true,
        removeDuplicates: false,
      };
      expect(convertList("AbC\nDeF", options)).toEqual("abc, def");
    });

    it("sorts ascending and descending with localeCompare", () => {
      const base: ConvertOptions = {
        ...DEFAULT_CONVERT_OPTIONS,
        removeDuplicates: false,
      };
      expect(
        convertList("b\na\nc", { ...base, sortList: "asc" }),
      ).toEqual("a, b, c");
      expect(
        convertList("b\na\nc", { ...base, sortList: "desc" }),
      ).toEqual("c, b, a");
    });

    it("reverses the list", () => {
      const options: ConvertOptions = {
        ...DEFAULT_CONVERT_OPTIONS,
        reverseList: true,
        removeDuplicates: false,
      };
      expect(convertList("1\n2\n3", options)).toEqual("3, 2, 1");
    });

    it("wraps items and the list", () => {
      const options: ConvertOptions = {
        ...DEFAULT_CONVERT_OPTIONS,
        itemPrefix: "'",
        itemSuffix: "'",
        listPrefix: "[",
        listSuffix: "]",
        removeDuplicates: false,
      };
      expect(convertList("1\n2", options)).toEqual("['1', '2']");
    });
  });
});

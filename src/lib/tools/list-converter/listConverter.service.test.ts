import { describe, expect, it } from "vitest";

import {
  DEFAULT_CONVERT_OPTIONS,
  convertList,
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

    it("dedupes before trim (it-tools order)", () => {
      const options: ConvertOptions = {
        ...DEFAULT_CONVERT_OPTIONS,
        removeDuplicates: true,
        trimItems: true,
      };
      expect(convertList("1 \n1\n1 ", options)).toEqual("1, 1");
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

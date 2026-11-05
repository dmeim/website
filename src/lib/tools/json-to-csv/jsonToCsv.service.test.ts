import { describe, expect, it } from "vitest";

import {
  convertArrayToCsv,
  getHeaders,
  getJsonError,
  isValidJson,
  jsonToCsv,
} from "./jsonToCsv.service";

describe("json-to-csv", () => {
  describe("getHeaders", () => {
    it("extracts all the keys from the array of objects", () => {
      expect(
        getHeaders({ array: [{ a: 1, b: 2 }, { a: 3, c: 4 }] }),
      ).toEqual(["a", "b", "c"]);
    });

    it("returns an empty array if the array is empty", () => {
      expect(getHeaders({ array: [] })).toEqual([]);
    });
  });

  describe("convertArrayToCsv", () => {
    it("converts an array of objects to a CSV string", () => {
      const array = [
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ];

      expect(convertArrayToCsv({ array })).toBe("a,b\n1,2\n3,4");
    });

    it("converts an array of objects with different keys to a CSV string", () => {
      const array = [
        { a: 1, b: 2 },
        { a: 3, c: 4 },
      ];

      expect(convertArrayToCsv({ array })).toBe("a,b,c\n1,2,\n3,,4");
    });

    it('when a value is null, it is converted to the string "null"', () => {
      const array = [{ a: null, b: 2 }];

      expect(convertArrayToCsv({ array })).toBe("a,b\nnull,2");
    });

    it("when a value is undefined, it is converted to an empty string", () => {
      const array = [{ a: undefined, b: 2 }, { b: 3 }];

      expect(convertArrayToCsv({ array })).toBe("a,b\n,2\n,3");
    });

    it("when a value contains a comma, it is wrapped in double quotes", () => {
      const array = [{ a: "hello, world", b: 2 }];

      expect(convertArrayToCsv({ array })).toBe('a,b\n"hello, world",2');
    });

    it("when a value contains a double quote, it is escaped with another double quote (RFC 4180)", () => {
      const array = [{ a: 'hello "world"', b: 2 }];

      expect(convertArrayToCsv({ array })).toBe('a,b\n"hello ""world""",2');
    });

    it("keeps newlines and carriage returns inside a quoted cell (RFC 4180)", () => {
      const array = [{ a: "line1\nline2\rrest", b: 2 }];

      expect(convertArrayToCsv({ array })).toBe('a,b\n"line1\nline2\rrest",2');
    });

    it("quotes headers that need it", () => {
      expect(convertArrayToCsv({ array: [{ "last, first": 1, 'say "hi"': 2 }] })).toBe(
        '"last, first","say ""hi"""\n1,2',
      );
    });

    it("writes nested values as JSON", () => {
      expect(convertArrayToCsv({ array: [{ a: { x: 1, y: "z" }, b: [1, 2], c: [] }] })).toBe(
        'a,b,c\n"{""x"":1,""y"":""z""}","[1,2]",[]',
      );
    });

    it("leaves cells empty for missing keys, even ones named like object built-ins", () => {
      expect(convertArrayToCsv({ array: [{ constructor: "x" }, { a: 1 }] })).toBe("constructor,a\nx,\n,1");
    });

    it("keeps unicode and booleans as they are", () => {
      expect(convertArrayToCsv({ array: [{ a: "é😀", b: true, c: 0 }] })).toBe("a,b,c\né😀,true,0");
    });
  });

  describe("jsonToCsv", () => {
    it("parses JSON5 and converts to CSV", () => {
      expect(
        jsonToCsv(`
[
  {'Age': 18.0, 'Salary': 20000.0, 'Gender': 'Male', 'Country': 'Germany', 'Purchased': 'N'},
  {'Age': 19.0, 'Salary': 22000.0, 'Gender': 'Female', 'Country': 'France', 'Purchased': 'N'},
]
`),
      ).toBe(
        "Age,Salary,Gender,Country,Purchased\n18,20000,Male,Germany,N\n19,22000,Female,France,N",
      );
    });

    it("returns empty string for empty, invalid, or non-array input", () => {
      expect(jsonToCsv("")).toBe("");
      expect(jsonToCsv("{unterminated")).toBe("");
      expect(jsonToCsv("not json")).toBe("");
      expect(jsonToCsv('{"a":1}')).toBe("");
      expect(jsonToCsv("42")).toBe("");
    });
  });

  describe("getJsonError", () => {
    it("accepts blank input and arrays of objects", () => {
      expect(getJsonError("")).toBeNull();
      expect(getJsonError("  \n")).toBeNull();
      expect(getJsonError("[]")).toBeNull();
      expect(getJsonError("[{a: 1}]")).toBeNull();
    });

    it("explains syntax errors with their position", () => {
      expect(getJsonError("[{a: }]")).toBe("Provided JSON is not valid: invalid character '}' at 1:6.");
    });

    it("explains values that are valid JSON but not convertible", () => {
      for (const value of ['{"a":1}', "42", "[1, 2, 3]", "[null]", "[[1]]", '[{"a":1}, 2]']) {
        expect(getJsonError(value), value).toMatch(/must be an array of objects/);
        expect(jsonToCsv(value), value).toBe("");
      }
    });
  });

  describe("isValidJson", () => {
    it("accepts empty and valid json / json5", () => {
      expect(isValidJson("")).toBe(true);
      expect(isValidJson('[{"a":1}]')).toBe(true);
      expect(isValidJson("[{a: 1}]")).toBe(true);
      expect(isValidJson("[1, 2, 3]")).toBe(true);
    });

    it("rejects invalid json", () => {
      expect(isValidJson("{unterminated")).toBe(false);
      expect(isValidJson("[1, 2")).toBe(false);
      expect(isValidJson("not json")).toBe(false);
    });
  });
});

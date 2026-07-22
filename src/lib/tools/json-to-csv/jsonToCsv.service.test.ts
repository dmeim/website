import { describe, expect, it } from "vitest";

import {
  convertArrayToCsv,
  getHeaders,
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

    it("when a value contains a double quote, it is escaped with a backslash", () => {
      const array = [{ a: 'hello "world"', b: 2 }];

      expect(convertArrayToCsv({ array })).toBe('a,b\nhello \\"world\\",2');
    });

    it("escapes newlines and carriage returns as literal escape sequences", () => {
      const array = [{ a: "line1\nline2\rrest", b: 2 }];

      expect(convertArrayToCsv({ array })).toBe("a,b\nline1\\nline2\\rrest,2");
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

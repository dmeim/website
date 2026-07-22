import { describe, expect, it } from "vitest";

import {
  codesByCategories,
  countHttpStatusCodes,
  filterHttpStatusCategories,
  flattenHttpStatusCodes,
  formatHttpStatusMeaning,
  formatHttpStatusTitle,
  getHttpStatusByCode,
} from "./httpStatusCodes.service";

describe("http-status-codes", () => {
  describe("data table", () => {
    it("includes the five standard category groups", () => {
      expect(codesByCategories.map((group) => group.category)).toEqual([
        "1xx informational response",
        "2xx success",
        "3xx redirection",
        "4xx client error",
        "5xx server error",
      ]);
    });

    it("contains expected well-known codes with names", () => {
      expect(getHttpStatusByCode(200)?.name).toBe("OK");
      expect(getHttpStatusByCode(404)?.name).toBe("Not Found");
      expect(getHttpStatusByCode(418)?.name).toBe("I'm a teapot");
      expect(getHttpStatusByCode(500)?.name).toBe("Internal Server Error");
    });

    it("marks WebDAV codes and formats the meaning suffix", () => {
      const processing = getHttpStatusByCode(102);
      expect(processing?.type).toBe("WebDav");
      expect(formatHttpStatusMeaning(processing!)).toContain("For WebDav.");

      const ok = getHttpStatusByCode(200)!;
      expect(formatHttpStatusMeaning(ok)).toBe(ok.description);
      expect(formatHttpStatusMeaning(ok)).not.toContain("For HTTP");
    });

    it("formats titles as code plus name", () => {
      expect(formatHttpStatusTitle(getHttpStatusByCode(301)!)).toBe(
        "301 Moved Permanently",
      );
    });

    it("counts flattened codes consistently", () => {
      const flat = flattenHttpStatusCodes();
      expect(countHttpStatusCodes()).toBe(flat.length);
      expect(flat.length).toBeGreaterThan(50);
      expect(flat.every((entry) => entry.category.length > 0)).toBe(true);
    });
  });

  describe("filterHttpStatusCategories", () => {
    it("returns all categories when the query is blank", () => {
      expect(filterHttpStatusCategories("")).toBe(codesByCategories);
      expect(filterHttpStatusCategories("   ")).toBe(codesByCategories);
    });

    it("collapses matches into a Search results group", () => {
      const result = filterHttpStatusCategories("not found");
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe("Search results");
      expect(result[0].codes.some((entry) => entry.code === 404)).toBe(true);
    });

    it("matches by numeric code", () => {
      const result = filterHttpStatusCategories("503");
      expect(result[0].codes.map((entry) => entry.code)).toContain(503);
      expect(
        result[0].codes.every(
          (entry) =>
            String(entry.code).includes("503") ||
            entry.name.toLowerCase().includes("503") ||
            entry.description.toLowerCase().includes("503"),
        ),
      ).toBe(true);
    });

    it("matches by category label", () => {
      const result = filterHttpStatusCategories("redirection");
      expect(result[0].codes.length).toBeGreaterThan(0);
      expect(result[0].codes.every((entry) => entry.code >= 300 && entry.code < 400)).toBe(
        true,
      );
    });

    it("returns an empty Search results group when nothing matches", () => {
      const result = filterHttpStatusCategories("zzzz-no-such-status");
      expect(result).toEqual([{ category: "Search results", codes: [] }]);
    });
  });
});

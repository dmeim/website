import { describe, expect, it } from "vitest";

import {
  ULID_FORMAT_DEFAULT,
  ULID_PATTERN,
  ULID_QUANTITY_DEFAULT,
  ULID_QUANTITY_MAX,
  ULID_QUANTITY_MIN,
  clampUlidQuantity,
  generateUlid,
  generateUlids,
  isValidUlid,
  normalizeUlidFormat,
} from "./ulidGenerator.service";

describe("ulid-generator", () => {
  describe("clampUlidQuantity", () => {
    it("clamps to the supported range", () => {
      expect(clampUlidQuantity(0)).toBe(ULID_QUANTITY_MIN);
      expect(clampUlidQuantity(-3)).toBe(ULID_QUANTITY_MIN);
      expect(clampUlidQuantity(999)).toBe(ULID_QUANTITY_MAX);
      expect(clampUlidQuantity(42)).toBe(42);
    });

    it("falls back for non-finite values", () => {
      expect(clampUlidQuantity(Number.NaN, 7)).toBe(7);
      expect(clampUlidQuantity("nope", 3)).toBe(3);
      expect(clampUlidQuantity(undefined)).toBe(ULID_QUANTITY_DEFAULT);
    });
  });

  describe("normalizeUlidFormat", () => {
    it("accepts known formats", () => {
      expect(normalizeUlidFormat("raw")).toBe("raw");
      expect(normalizeUlidFormat("json")).toBe("json");
    });

    it("falls back for unknown values", () => {
      expect(normalizeUlidFormat("xml")).toBe(ULID_FORMAT_DEFAULT);
      expect(normalizeUlidFormat(null)).toBe(ULID_FORMAT_DEFAULT);
    });
  });

  describe("generateUlid / isValidUlid", () => {
    it("returns a 26-character Crockford Base32 ULID", () => {
      const id = generateUlid();
      expect(id).toMatch(ULID_PATTERN);
      expect(id).toMatch(/^[0-9A-Z]{26}$/);
      expect(isValidUlid(id)).toBe(true);
    });

    it("encodes the provided timestamp into the time prefix", () => {
      const fixed = 1_700_000_000_000;
      const a = generateUlid(fixed);
      const b = generateUlid(fixed);
      expect(a.slice(0, 10)).toBe(b.slice(0, 10));
      expect(a).not.toBe(b);
    });

    it("rejects malformed values", () => {
      expect(isValidUlid("")).toBe(false);
      expect(isValidUlid("too-short")).toBe(false);
      expect(isValidUlid("01ARZ3NDEKTSV4RRFFQ69G5FAV!")).toBe(false);
      expect(isValidUlid("01ARZ3NDEKTSV4RRFFQ69G5FAI")).toBe(false); // I not in Crockford
    });
  });

  describe("generateUlids", () => {
    it("defaults to a single raw ULID", () => {
      const value = generateUlids();
      expect(value).toMatch(ULID_PATTERN);
      expect(value).not.toContain("\n");
      expect(isValidUlid(value)).toBe(true);
    });

    it("returns newline-joined raw output for quantity > 1", () => {
      const lines = generateUlids({ quantity: 5, format: "raw" }).split("\n");
      expect(lines).toHaveLength(5);
      for (const line of lines) {
        expect(line).toMatch(/^[0-9A-Z]{26}$/);
        expect(isValidUlid(line)).toBe(true);
      }
      expect(new Set(lines).size).toBe(5);
    });

    it("returns pretty-printed JSON when format is json", () => {
      const value = generateUlids({ quantity: 3, format: "json" });
      const parsed = JSON.parse(value) as string[];
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(3);
      for (const id of parsed) {
        expect(id).toMatch(/^[0-9A-Z]{26}$/);
      }
      expect(value).toBe(JSON.stringify(parsed, null, 2));
    });

    it("clamps quantity before generating", () => {
      expect(generateUlids({ quantity: 200, format: "raw" }).split("\n")).toHaveLength(
        ULID_QUANTITY_MAX,
      );
      expect(generateUlids({ quantity: 0, format: "raw" }).split("\n")).toHaveLength(
        ULID_QUANTITY_MIN,
      );
    });
  });
});

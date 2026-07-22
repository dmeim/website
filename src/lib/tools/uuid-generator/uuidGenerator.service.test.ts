import { describe, expect, it } from "vitest";

import {
  NIL_UUID,
  UUID_NAMESPACE_DEFAULT,
  UUID_NAMESPACE_PRESETS,
  UUID_QUANTITY_DEFAULT,
  UUID_QUANTITY_MAX,
  UUID_QUANTITY_MIN,
  UUID_VERSION_DEFAULT,
  clampUuidQuantity,
  generateUuids,
  isValidUuid,
  isValidUuidNamespace,
  normalizeUuidVersion,
} from "./uuidGenerator.service";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("uuid-generator", () => {
  describe("clampUuidQuantity", () => {
    it("clamps to the supported range", () => {
      expect(clampUuidQuantity(0)).toBe(UUID_QUANTITY_MIN);
      expect(clampUuidQuantity(-3)).toBe(UUID_QUANTITY_MIN);
      expect(clampUuidQuantity(999)).toBe(UUID_QUANTITY_MAX);
      expect(clampUuidQuantity(12)).toBe(12);
    });

    it("falls back for non-finite values", () => {
      expect(clampUuidQuantity(Number.NaN, 7)).toBe(7);
      expect(clampUuidQuantity("nope", 3)).toBe(3);
      expect(clampUuidQuantity(undefined)).toBe(UUID_QUANTITY_DEFAULT);
    });
  });

  describe("normalizeUuidVersion", () => {
    it("accepts known versions", () => {
      expect(normalizeUuidVersion("NIL")).toBe("NIL");
      expect(normalizeUuidVersion("v1")).toBe("v1");
      expect(normalizeUuidVersion("v5")).toBe("v5");
    });

    it("falls back for unknown values", () => {
      expect(normalizeUuidVersion("v7")).toBe(UUID_VERSION_DEFAULT);
      expect(normalizeUuidVersion(null)).toBe(UUID_VERSION_DEFAULT);
    });
  });

  describe("isValidUuidNamespace", () => {
    it("accepts NIL and RFC namespaces", () => {
      expect(isValidUuidNamespace(NIL_UUID)).toBe(true);
      expect(isValidUuidNamespace(UUID_NAMESPACE_PRESETS.DNS)).toBe(true);
      expect(isValidUuidNamespace(UUID_NAMESPACE_PRESETS.URL.toUpperCase())).toBe(true);
    });

    it("rejects empty and malformed values", () => {
      expect(isValidUuidNamespace("")).toBe(false);
      expect(isValidUuidNamespace("not-a-uuid")).toBe(false);
      expect(isValidUuidNamespace("00000000-0000-0000-0000-00000000000g")).toBe(false);
    });
  });

  describe("generateUuids", () => {
    it("defaults to a single v4 UUID", () => {
      const value = generateUuids();
      expect(value).toMatch(UUID_PATTERN);
      expect(value).not.toContain("\n");
      expect(isValidUuid(value)).toBe(true);
    });

    it("returns NIL for the NIL version", () => {
      expect(generateUuids({ version: "NIL", quantity: 1 })).toBe(NIL_UUID);
      expect(generateUuids({ version: "NIL", quantity: 3 })).toBe(
        [NIL_UUID, NIL_UUID, NIL_UUID].join("\n"),
      );
    });

    it("generates v4 UUIDs with the requested quantity", () => {
      const lines = generateUuids({ version: "v4", quantity: 5 }).split("\n");
      expect(lines).toHaveLength(5);
      for (const line of lines) {
        expect(line).toMatch(UUID_PATTERN);
        expect(line[14]).toBe("4");
      }
    });

    it("generates distinct v1 UUIDs in a batch via clockseq index", () => {
      const lines = generateUuids({ version: "v1", quantity: 8 }).split("\n");
      expect(lines).toHaveLength(8);
      expect(new Set(lines).size).toBe(8);
      for (const line of lines) {
        expect(line[14]).toBe("1");
      }
    });

    it("produces deterministic v3 / v5 for the same name and namespace", () => {
      const name = "example.com";
      const namespace = UUID_NAMESPACE_PRESETS.DNS;

      expect(generateUuids({ version: "v3", namespace, name })).toBe(
        generateUuids({ version: "v3", namespace, name }),
      );
      expect(generateUuids({ version: "v5", namespace, name })).toBe(
        generateUuids({ version: "v5", namespace, name }),
      );

      const v3 = generateUuids({ version: "v3", namespace, name });
      const v5 = generateUuids({ version: "v5", namespace, name });
      expect(v3[14]).toBe("3");
      expect(v5[14]).toBe("5");
      expect(v3).not.toBe(v5);
    });

    it("uses the URL namespace by default for name-based versions", () => {
      const named = generateUuids({ version: "v5", name: "hello" });
      const explicit = generateUuids({
        version: "v5",
        name: "hello",
        namespace: UUID_NAMESPACE_DEFAULT,
      });
      expect(named).toBe(explicit);
    });

    it("returns an empty string when the namespace is invalid for v3/v5", () => {
      expect(
        generateUuids({
          version: "v5",
          name: "hello",
          namespace: "not-a-valid-namespace",
        }),
      ).toBe("");
      expect(
        generateUuids({
          version: "v3",
          name: "hello",
          namespace: "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz",
        }),
      ).toBe("");
    });

    it("clamps quantity before generating", () => {
      expect(generateUuids({ version: "NIL", quantity: 100 }).split("\n")).toHaveLength(
        UUID_QUANTITY_MAX,
      );
      expect(generateUuids({ version: "NIL", quantity: 0 }).split("\n")).toHaveLength(
        UUID_QUANTITY_MIN,
      );
    });
  });
});

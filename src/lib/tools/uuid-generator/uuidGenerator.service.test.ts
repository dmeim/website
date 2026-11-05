import { describe, expect, it, vi } from "vitest";

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

  describe("published vectors and structure", () => {
    it("matches the Python docs v3 and v5 vectors for python.org", () => {
      const namespace = UUID_NAMESPACE_PRESETS.DNS;
      expect(generateUuids({ version: "v3", namespace, name: "python.org" })).toBe("6fa459ea-ee8a-3ca4-894e-db77e160355e");
      expect(generateUuids({ version: "v5", namespace, name: "python.org" })).toBe("886313e1-3b8a-5372-9b90-0c9aee199e5d");
    });

    it("generates structurally valid v1 and v4 with the RFC variant", () => {
      for (const [version, digit] of [["v1", "1"], ["v4", "4"]] as const) {
        for (const id of generateUuids({ version, quantity: 20 }).split("\n")) {
          expect(id).toMatch(new RegExp(`^[0-9a-f]{8}-[0-9a-f]{4}-${digit}[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`));
        }
      }
    });

    it("builds v1 from Web Crypto and marks the random node with the multicast bit", () => {
      const spy = vi.spyOn(Math, "random");
      const id = generateUuids({ version: "v1" });
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
      expect(Number.parseInt(id.slice(24, 26), 16) & 1).toBe(1);
    });

    it("rejects a namespace with stray whitespace instead of generating nothing silently", () => {
      expect(isValidUuidNamespace(` ${UUID_NAMESPACE_PRESETS.DNS}`)).toBe(false);
      expect(generateUuids({ version: "v5", namespace: ` ${UUID_NAMESPACE_PRESETS.DNS}`, name: "x" })).toBe("");
    });
  });
});

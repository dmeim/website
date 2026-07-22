import { describe, expect, it } from "vitest";

import {
  getExtensionsForMime,
  getMimeForExtension,
  isKnownExtension,
  isKnownMimeType,
  listExtensions,
  listMimeInfos,
  listMimeTypes,
  normalizeExtension,
} from "./mimeTypes.service";

describe("mime-types", () => {
  describe("normalizeExtension", () => {
    it("strips a leading dot and lowercases", () => {
      expect(normalizeExtension(".PDF")).toBe("pdf");
      expect(normalizeExtension("  Jpg ")).toBe("jpg");
      expect(normalizeExtension("")).toBe("");
    });
  });

  describe("getExtensionsForMime", () => {
    it("returns extensions for common MIME types", () => {
      expect(getExtensionsForMime("application/pdf")).toEqual(["pdf"]);
      expect(getExtensionsForMime("image/jpeg")).toContain("jpg");
      expect(getExtensionsForMime("image/jpeg")).toContain("jpeg");
    });

    it("returns an empty array for unknown or blank MIME types", () => {
      expect(getExtensionsForMime("")).toEqual([]);
      expect(getExtensionsForMime("application/x-not-a-real-type")).toEqual([]);
    });
  });

  describe("getMimeForExtension", () => {
    it("resolves common extensions with or without a leading dot", () => {
      expect(getMimeForExtension("pdf")).toBe("application/pdf");
      expect(getMimeForExtension(".pdf")).toBe("application/pdf");
      expect(getMimeForExtension("JSON")).toBe("application/json");
    });

    it("returns undefined for unknown or blank extensions", () => {
      expect(getMimeForExtension("")).toBeUndefined();
      expect(getMimeForExtension(".")).toBeUndefined();
      expect(getMimeForExtension("notarealextzzz")).toBeUndefined();
    });
  });

  describe("isKnownMimeType / isKnownExtension", () => {
    it("detects known entries", () => {
      expect(isKnownMimeType("text/plain")).toBe(true);
      expect(isKnownExtension("txt")).toBe(true);
      expect(isKnownExtension(".html")).toBe(true);
    });

    it("rejects unknown entries", () => {
      expect(isKnownMimeType("")).toBe(false);
      expect(isKnownMimeType("no/such-type")).toBe(false);
      expect(isKnownExtension("")).toBe(false);
      expect(isKnownExtension("zzzznotreal")).toBe(false);
    });
  });

  describe("list helpers", () => {
    it("lists sorted MIME types and extensions with table parity", () => {
      const mimes = listMimeTypes();
      const exts = listExtensions();
      const infos = listMimeInfos();

      expect(mimes.length).toBeGreaterThan(100);
      expect(exts.length).toBeGreaterThan(100);
      expect(infos).toHaveLength(mimes.length);
      expect(mimes).toEqual([...mimes].sort((a, b) => a.localeCompare(b)));
      expect(exts).toEqual([...exts].sort((a, b) => a.localeCompare(b)));
      expect(mimes).toContain("application/pdf");
      expect(exts).toContain("pdf");
      expect(infos.find((row) => row.mimeType === "application/pdf")?.extensions).toEqual([
        "pdf",
      ]);
    });
  });
});

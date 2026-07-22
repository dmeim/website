import { describe, expect, it } from "vitest";

import {
  buildDownloadFromBase64,
  getExtensionFromMimeType,
  getMimeTypeFromBase64,
  getMimeTypeFromExtension,
  isValidBase64,
  resolvePreviewImageSrc,
  suggestExtensionFromBase64,
} from "./base64FileConverter.service";

describe("base64-file-converter", () => {
  describe("getMimeTypeFromBase64", () => {
    it("when the base64 string has a data URI, it returns the mime type", () => {
      expect(
        getMimeTypeFromBase64(
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA",
        ),
      ).toEqual({ mimeType: "image/png" });
      expect(
        getMimeTypeFromBase64(
          "data:image/jpg;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA",
        ),
      ).toEqual({ mimeType: "image/jpg" });
    });

    it("when the base64 string has no data URI, it try to infer the mime type from the signature", () => {
      expect(
        getMimeTypeFromBase64("iVBORw0KGgoAAAANSUhEUgAAAAUA"),
      ).toEqual({ mimeType: "image/png" });

      expect(getMimeTypeFromBase64("R0lGODdh")).toEqual({
        mimeType: "image/gif",
      });
      expect(getMimeTypeFromBase64("R0lGODlh")).toEqual({
        mimeType: "image/gif",
      });

      expect(getMimeTypeFromBase64("/9j/")).toEqual({ mimeType: "image/jpg" });

      expect(getMimeTypeFromBase64("JVBERi0")).toEqual({
        mimeType: "application/pdf",
      });
    });

    it("when the base64 string has no data URI and no signature, it returns an undefined mimeType", () => {
      expect(getMimeTypeFromBase64("JVBERi")).toEqual({
        mimeType: undefined,
      });
    });
  });

  describe("getExtensionFromMimeType / getMimeTypeFromExtension", () => {
    it("maps sniffed image and pdf mime types to extensions", () => {
      expect(getExtensionFromMimeType("image/png")).toBe("png");
      expect(getExtensionFromMimeType("image/gif")).toBe("gif");
      expect(getExtensionFromMimeType("image/jpg")).toBe("jpg");
      expect(getExtensionFromMimeType("image/jpeg")).toBe("jpg");
      expect(getExtensionFromMimeType("application/pdf")).toBe("pdf");
      expect(getExtensionFromMimeType("application/x-unknown")).toBeUndefined();
    });

    it("maps common extensions back to mime types", () => {
      expect(getMimeTypeFromExtension("png")).toBe("image/png");
      expect(getMimeTypeFromExtension(".txt")).toBe("text/plain");
      expect(getMimeTypeFromExtension("pdf")).toBe("application/pdf");
      expect(getMimeTypeFromExtension("xyz")).toBeUndefined();
    });
  });

  describe("suggestExtensionFromBase64", () => {
    it("updates extension when mime is sniffed", () => {
      expect(suggestExtensionFromBase64("iVBORw0KGgo", "")).toBe("png");
      expect(suggestExtensionFromBase64("JVBERi0", "bin")).toBe("pdf");
    });

    it("keeps current extension when mime cannot be sniffed", () => {
      expect(suggestExtensionFromBase64("not-a-signature", "dat")).toBe("dat");
    });
  });

  describe("buildDownloadFromBase64", () => {
    it("throws on empty source", () => {
      expect(() => buildDownloadFromBase64({ sourceValue: "" })).toThrow(
        "Base64 string is empty",
      );
    });

    it("keeps existing data URI and default filename", () => {
      const result = buildDownloadFromBase64({
        sourceValue: "data:image/png;base64,iVBORw0KGgo=",
      });
      expect(result.dataUrl).toBe("data:image/png;base64,iVBORw0KGgo=");
      expect(result.filename).toBe("file.png");
    });

    it("wraps bare base64 using extension mime when no sniff", () => {
      const result = buildDownloadFromBase64({
        sourceValue: "YQ==",
        filename: "notes",
        extension: "txt",
      });
      expect(result.dataUrl).toBe("data:text/plain;base64,YQ==");
      expect(result.filename).toBe("notes.txt");
    });

    it("appends extension when filename lacks it", () => {
      const result = buildDownloadFromBase64({
        sourceValue: "iVBORw0KGgo=",
        filename: "shot",
        extension: "png",
      });
      expect(result.filename).toBe("shot.png");
      expect(result.dataUrl).toBe("iVBORw0KGgo=");
    });

    it("does not double-append matching extension", () => {
      const result = buildDownloadFromBase64({
        sourceValue: "YQ==",
        filename: "notes.txt",
        extension: "txt",
      });
      expect(result.filename).toBe("notes.txt");
    });
  });

  describe("resolvePreviewImageSrc", () => {
    it("throws on empty input", () => {
      expect(() => resolvePreviewImageSrc("")).toThrow(
        "Base64 string is empty",
      );
    });

    it("passes through data URIs", () => {
      expect(resolvePreviewImageSrc("data:image/png;base64,abc")).toBe(
        "data:image/png;base64,abc",
      );
    });

    it("wraps sniffed image signatures", () => {
      expect(resolvePreviewImageSrc("iVBORw0KGgo=")).toBe(
        "data:image/png;base64,iVBORw0KGgo=",
      );
    });
  });

  describe("isValidBase64 (shared)", () => {
    it("accepts valid and rejects invalid base64", () => {
      expect(isValidBase64("")).toBe(true);
      expect(isValidBase64("YQ==")).toBe(true);
      expect(isValidBase64("a")).toBe(false);
    });
  });
});

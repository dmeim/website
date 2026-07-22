import { describe, expect, it } from "vitest";

import {
  NO_SIGNATURES_MESSAGE,
  formatCertDate,
  formatFileBytes,
  normalizeVerifyResult,
  partyFieldRows,
} from "./pdfSignatureChecker.service";
import type { SignatureInfo } from "./pdfSignatureChecker.types";

const sampleSignature = {
  verified: true,
  authenticity: true,
  integrity: true,
  expired: false,
  meta: {
    certs: [],
    signatureMeta: {
      reason: "",
      contactInfo: null,
      location: "",
      name: null,
    },
  },
} satisfies SignatureInfo;

describe("pdf-signature-checker", () => {
  describe("normalizeVerifyResult", () => {
    it("returns signatures when present", () => {
      expect(normalizeVerifyResult({ signatures: [sampleSignature] })).toEqual([
        sampleSignature,
      ]);
    });

    it("throws the library message on soft-fail without signatures", () => {
      expect(() =>
        normalizeVerifyResult({ verified: false, message: "cannot find subfilter" }),
      ).toThrow("cannot find subfilter");
    });

    it("throws the default message when signatures are empty", () => {
      expect(() => normalizeVerifyResult({ signatures: [] })).toThrow(NO_SIGNATURES_MESSAGE);
    });

    it("throws the default message when signatures are missing", () => {
      expect(() => normalizeVerifyResult({ verified: false })).toThrow(NO_SIGNATURES_MESSAGE);
    });
  });

  describe("formatFileBytes", () => {
    it("formats bytes and larger units", () => {
      expect(formatFileBytes(0)).toBe("0 B");
      expect(formatFileBytes(512)).toBe("512 B");
      expect(formatFileBytes(1024)).toBe("1.0 KB");
      expect(formatFileBytes(10 * 1024)).toBe("10 KB");
      expect(formatFileBytes(1536)).toBe("1.5 KB");
      expect(formatFileBytes(1.5 * 1024 * 1024)).toBe("1.5 MB");
    });

    it("guards non-finite input", () => {
      expect(formatFileBytes(Number.NaN)).toBe("0 B");
      expect(formatFileBytes(-1)).toBe("0 B");
    });
  });

  describe("formatCertDate", () => {
    it("formats a parseable date", () => {
      const formatted = formatCertDate("2020-01-15T12:00:00.000Z", "en-US");
      expect(formatted).toContain("2020");
      expect(formatted).not.toBe("2020-01-15T12:00:00.000Z");
    });

    it("returns the raw string when unparseable", () => {
      expect(formatCertDate("not-a-date")).toBe("not-a-date");
    });
  });

  describe("partyFieldRows", () => {
    it("includes non-empty fields in display order and skips blanks", () => {
      expect(
        partyFieldRows({
          commonName: "Example CA",
          organizationName: "Example Org",
          countryName: "US",
          localityName: "",
          organizationalUnitName: "IT",
          stateOrProvinceName: undefined,
        }),
      ).toEqual([
        { label: "Common name", value: "Example CA" },
        { label: "Organization name", value: "Example Org" },
        { label: "Country name", value: "US" },
        { label: "Organizational unit name", value: "IT" },
      ]);
    });
  });
});

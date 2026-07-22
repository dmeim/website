import type {
  CertificateParty,
  SignatureInfo,
  VerifyPdfFn,
  VerifyPdfRawResult,
} from "./pdfSignatureChecker.types";

export const NO_SIGNATURES_MESSAGE = "No signatures found in the provided file.";

export const CERT_PARTY_FIELDS: ReadonlyArray<{
  key: keyof CertificateParty;
  label: string;
}> = [
  { key: "commonName", label: "Common name" },
  { key: "organizationName", label: "Organization name" },
  { key: "countryName", label: "Country name" },
  { key: "localityName", label: "Locality name" },
  { key: "organizationalUnitName", label: "Organizational unit name" },
  { key: "stateOrProvinceName", label: "State or province name" },
  { key: "serialNumber", label: "Serial number" },
];

/**
 * Normalize pdf-signature-reader output: missing/empty signatures become an Error
 * (the library soft-fails with `{ verified: false, message }` instead of throwing).
 */
export function normalizeVerifyResult(result: VerifyPdfRawResult): SignatureInfo[] {
  const signatures = result.signatures;
  if (!Array.isArray(signatures) || signatures.length === 0) {
    const message =
      typeof result.message === "string" && result.message.trim()
        ? result.message.trim()
        : NO_SIGNATURES_MESSAGE;
    throw new Error(message);
  }
  return signatures;
}

/** Format a byte length for display (SI-ish, matching common tool UIs). */
export function formatFileBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 B";
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }
  const units = ["KB", "MB", "GB", "TB"] as const;
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const digits = value >= 10 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[unitIndex]}`;
}

/** Locale-format a certificate validity date string; falls back to the raw value. */
export function formatCertDate(value: string, locales?: string | string[]): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(locales);
}

export type PartyFieldRow = { label: string; value: string };

/** Flatten certificate party fields for UI tables (omit empty optional values). */
export function partyFieldRows(party: CertificateParty): PartyFieldRow[] {
  const rows: PartyFieldRow[] = [];
  for (const { key, label } of CERT_PARTY_FIELDS) {
    const value = party[key];
    if (typeof value === "string" && value.trim()) {
      rows.push({ label, value });
    }
  }
  return rows;
}

type PdfSignatureReaderModule = {
  default?: VerifyPdfFn;
} & VerifyPdfFn;

/** Dynamic client-only load of pdf-signature-reader (never call from SSR). */
export async function loadVerifyPdf(): Promise<VerifyPdfFn> {
  const mod = (await import("pdf-signature-reader")) as PdfSignatureReaderModule;
  const verify = typeof mod === "function" ? mod : mod.default;
  if (typeof verify !== "function") {
    throw new Error("pdf-signature-reader did not export a verify function.");
  }
  return verify;
}

/**
 * Verify PDF signatures via pdf-signature-reader.
 * Soft-fail / empty signature results are raised as Error.
 */
export async function verifyPdfSignatures(
  pdf: ArrayBuffer | Uint8Array,
): Promise<SignatureInfo[]> {
  const verifyPDF = await loadVerifyPdf();
  let result: VerifyPdfRawResult;
  try {
    result = verifyPDF(pdf);
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message.trim()
        : NO_SIGNATURES_MESSAGE;
    throw new Error(message);
  }
  return normalizeVerifyResult(result);
}

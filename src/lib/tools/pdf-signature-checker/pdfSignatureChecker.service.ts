import type {
  CertificateParty,
  SignatureInfo,
  VerifyPdfFn,
  VerifyPdfRawResult,
} from "./pdfSignatureChecker.types";

export const NO_SIGNATURES_MESSAGE = "No signatures found in the provided file.";
export const UNSUPPORTED_SIGNATURE_MESSAGE =
  "This PDF uses a signature format this tool cannot read. Only adbe.pkcs7.detached and etsi.cades.detached signatures are supported.";
export const UNREADABLE_SIGNATURE_MESSAGE =
  "This PDF appears to be signed, but the signature could not be read. The file may be damaged.";

export const CHECKER_UNAVAILABLE_MESSAGE =
  "The signature checker could not load. Check your connection and reload the page.";

/** Turns pdf-signature-reader's internal error text into a message a person can act on. */
export function friendlyVerifyMessage(libraryMessage: unknown): string {
  const message = typeof libraryMessage === "string" ? libraryMessage : "";
  if (!message.trim() || /byterange|cannot find subfilter/i.test(message)) {
    return NO_SIGNATURES_MESSAGE;
  }
  return /subfilter .* not supported/i.test(message) ? UNSUPPORTED_SIGNATURE_MESSAGE : UNREADABLE_SIGNATURE_MESSAGE;
}

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
    throw new Error(friendlyVerifyMessage(result.message));
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

type PdfSignatureReaderModule = VerifyPdfFn | { default?: VerifyPdfFn };

/** Dynamic client-only load of pdf-signature-reader (never call from SSR). */
export async function loadVerifyPdf(): Promise<VerifyPdfFn> {
  const mod = (await import("pdf-signature-reader")) as unknown as PdfSignatureReaderModule;
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
  let verifyPDF: VerifyPdfFn;
  try {
    verifyPDF = await loadVerifyPdf();
  } catch (error) {
    console.error("Failed to load pdf-signature-reader", error);
    throw new Error(CHECKER_UNAVAILABLE_MESSAGE);
  }
  let result: VerifyPdfRawResult;
  try {
    result = verifyPDF(pdf);
  } catch (error) {
    throw new Error(friendlyVerifyMessage(error instanceof Error ? error.message : undefined));
  }
  return normalizeVerifyResult(result);
}

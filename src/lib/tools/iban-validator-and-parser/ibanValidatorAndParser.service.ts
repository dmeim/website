/**
 * IBAN validation and parsing via ibantools (parity with it-tools).
 */

import {
  ValidationErrorsIBAN,
  extractIBAN,
  friendlyFormatIBAN,
  isQRIBAN,
  validateIBAN,
} from "ibantools";

export const IBAN_EXAMPLES = [
  "FR7630006000011234567890189",
  "DE89370400440532013000",
  "GB29NWBK60161331926819",
] as const;

const ibanErrorToMessage: Record<ValidationErrorsIBAN, string> = {
  [ValidationErrorsIBAN.NoIBANProvided]: "No IBAN provided",
  [ValidationErrorsIBAN.NoIBANCountry]: "No IBAN country",
  [ValidationErrorsIBAN.WrongBBANLength]: "Wrong BBAN length",
  [ValidationErrorsIBAN.WrongBBANFormat]: "Wrong BBAN format",
  [ValidationErrorsIBAN.ChecksumNotNumber]: "Checksum is not a number",
  [ValidationErrorsIBAN.WrongIBANChecksum]: "Wrong IBAN checksum",
  [ValidationErrorsIBAN.WrongAccountBankBranchChecksum]:
    "Wrong account bank branch checksum",
  [ValidationErrorsIBAN.QRIBANNotAllowed]: "QR-IBAN not allowed",
};

export type IbanInfo = {
  isValid: boolean;
  errors: string[];
  isQrIban: boolean;
  countryCode: string | undefined;
  bban: string | undefined;
  friendlyFormat: string;
};

/** Strip spaces/dashes and uppercase (parity with it-tools input normalize). */
export function normalizeIban(raw: string): string {
  return raw.toUpperCase().replace(/\s/g, "").replace(/-/g, "");
}

/** Map ibantools error codes to human-readable messages. */
export function getFriendlyErrors(errorCodes: ValidationErrorsIBAN[]): string[] {
  return errorCodes
    .map((errorCode) => ibanErrorToMessage[errorCode])
    .filter(Boolean);
}

/**
 * Validate and parse an IBAN string.
 * Returns `undefined` when the normalized input is empty.
 */
export function parseIban(raw: string): IbanInfo | undefined {
  const iban = normalizeIban(raw);
  if (iban === "") {
    return undefined;
  }

  const { valid: isValid, errorCodes } = validateIBAN(iban);
  const extracted = extractIBAN(iban);

  return {
    isValid,
    errors: getFriendlyErrors(errorCodes),
    isQrIban: isQRIBAN(iban),
    countryCode: extracted.countryCode,
    bban: extracted.bban,
    friendlyFormat: friendlyFormatIBAN(iban) ?? iban,
  };
}

/** Format an IBAN with spaces for display (examples list). */
export function formatIbanFriendly(raw: string): string {
  const iban = normalizeIban(raw);
  if (iban === "") {
    return "";
  }
  return friendlyFormatIBAN(iban) ?? iban;
}

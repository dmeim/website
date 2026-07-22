/**
 * Phone number parse / validate / format via libphonenumber-js/max
 * (parity with it-tools phone-parser-and-formatter).
 */

import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberWithError,
  type CountryCode,
  type NumberType,
} from "libphonenumber-js/max";

export type PhoneCountryOption = {
  code: CountryCode;
  label: string;
  callingCode: string;
};

export type PhoneParseResult = {
  countryCode: string | undefined;
  countryName: string | undefined;
  countryCallingCode: string | undefined;
  isValid: boolean;
  isPossible: boolean;
  type: string | undefined;
  international: string | undefined;
  national: string | undefined;
  e164: string | undefined;
  rfc3966: string | undefined;
};

const typeToLabel: Record<NonNullable<NumberType>, string> = {
  MOBILE: "Mobile",
  FIXED_LINE: "Fixed line",
  FIXED_LINE_OR_MOBILE: "Fixed line or mobile",
  PERSONAL_NUMBER: "Personal number",
  PREMIUM_RATE: "Premium rate",
  SHARED_COST: "Shared cost",
  TOLL_FREE: "Toll free",
  UAN: "Universal access number",
  VOICEMAIL: "Voicemail",
  VOIP: "VoIP",
  PAGER: "Pager",
};

const PHONE_INPUT_PATTERN = /^[0-9 +\-()]+$/;

/** True when empty or only digits / spaces / + - ( ). */
export function isValidPhoneInput(value: string): boolean {
  return value === "" || PHONE_INPUT_PATTERN.test(value);
}

/** Map libphonenumber number type to a human-readable label. */
export function formatTypeToHumanReadable(
  type: NumberType,
): string | undefined {
  if (!type) {
    return undefined;
  }
  return typeToLabel[type];
}

/**
 * Resolve ISO country code to a display name via Intl (native-first;
 * it-tools used country-code-lookup).
 */
export function getFullCountryName(
  countryCode: string | undefined,
  locale = "en",
): string | undefined {
  if (!countryCode) {
    return undefined;
  }

  try {
    return (
      new Intl.DisplayNames([locale], { type: "region" }).of(countryCode) ??
      undefined
    );
  } catch {
    return undefined;
  }
}

/**
 * Default country from locale region (e.g. en-US → US), else `defaultCode`.
 * Falls back to FR when the region is missing or not a libphonenumber country.
 */
export function getDefaultCountryCode({
  locale,
  defaultCode = "FR",
}: {
  locale?: string;
  defaultCode?: CountryCode;
} = {}): CountryCode {
  const resolved =
    locale ??
    (typeof navigator !== "undefined" ? navigator.language : undefined);

  if (!resolved) {
    return defaultCode;
  }

  const countryCode = resolved.split("-")[1]?.toUpperCase();
  if (!countryCode) {
    return defaultCode;
  }

  const supported = getCountries();
  return supported.includes(countryCode as CountryCode)
    ? (countryCode as CountryCode)
    : defaultCode;
}

/** Country select options: "United States (+1)" style labels. */
export function getCountryOptions(locale = "en"): PhoneCountryOption[] {
  return getCountries().map((code) => {
    const callingCode = getCountryCallingCode(code);
    const name = getFullCountryName(code, locale) ?? code;
    return {
      code,
      callingCode,
      label: `${name} (+${callingCode})`,
    };
  });
}

/**
 * Parse and format a phone number for the given default country.
 * Returns `undefined` when input is empty, fails character validation,
 * or cannot be parsed.
 */
export function parsePhone(
  raw: string,
  defaultCountryCode: CountryCode = "FR",
): PhoneParseResult | undefined {
  const trimmed = raw.trim();
  if (trimmed === "" || !isValidPhoneInput(raw)) {
    return undefined;
  }

  try {
    const parsed = parsePhoneNumberWithError(raw, defaultCountryCode);
    return {
      countryCode: parsed.country,
      countryName: getFullCountryName(parsed.country),
      countryCallingCode: parsed.countryCallingCode
        ? String(parsed.countryCallingCode)
        : undefined,
      isValid: parsed.isValid(),
      isPossible: parsed.isPossible(),
      type: formatTypeToHumanReadable(parsed.getType()),
      international: parsed.formatInternational(),
      national: parsed.formatNational(),
      e164: parsed.format("E.164"),
      rfc3966: parsed.format("RFC3966"),
    };
  } catch {
    return undefined;
  }
}

export function booleanToHumanReadable(value: boolean): string {
  return value ? "Yes" : "No";
}

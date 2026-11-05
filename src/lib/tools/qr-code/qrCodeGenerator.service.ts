import type { QrErrorCorrectionLevel } from "./qrCode.service";

import {
  type EapMethod,
  type EapPhase2Method,
  type WifiEncryption,
  buildWifiQrPayload,
} from "./wifiPayload.service";

export interface QrCodeGeneratorSettings {
  text: string;
  foregroundColor: string;
  backgroundColor: string;
  transparentBackground: boolean;
  errorCorrectionLevel: QrErrorCorrectionLevel;
  size: number;
  margin: number;
}

export const QR_DEFAULT_SIZE = 1024;
export const QR_DEFAULT_MARGIN = 4;

export const QR_CONTENT_TYPES = [
  { value: "text", label: "Plain text" },
  { value: "website", label: "Website" },
  { value: "social", label: "Social media" },
  { value: "contact", label: "Contact" },
  { value: "wifi", label: "WiFi" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone call" },
  { value: "sms", label: "SMS" },
  { value: "location", label: "Location" },
] as const;

export type QrContentType = (typeof QR_CONTENT_TYPES)[number]["value"];

export const SOCIAL_PLATFORMS = [
  { value: "facebook", label: "Facebook", baseUrl: "https://www.facebook.com/", prefix: "" },
  { value: "instagram", label: "Instagram", baseUrl: "https://www.instagram.com/", prefix: "" },
  { value: "snapchat", label: "Snapchat", baseUrl: "https://www.snapchat.com/add/", prefix: "" },
  { value: "tiktok", label: "TikTok", baseUrl: "https://www.tiktok.com/", prefix: "@" },
  { value: "x", label: "X / Twitter", baseUrl: "https://x.com/", prefix: "" },
  { value: "youtube", label: "YouTube", baseUrl: "https://www.youtube.com/", prefix: "@" },
  { value: "linkedin", label: "LinkedIn", baseUrl: "https://www.linkedin.com/in/", prefix: "" },
  { value: "pinterest", label: "Pinterest", baseUrl: "https://www.pinterest.com/", prefix: "" },
  { value: "threads", label: "Threads", baseUrl: "https://www.threads.net/", prefix: "@" },
] as const;

export type SocialPlatformId = (typeof SOCIAL_PLATFORMS)[number]["value"];

export interface QrContentFormState {
  type: QrContentType;
  text: string;
  websiteUrl: string;
  socialPlatform: SocialPlatformId;
  socialValue: string;
  contactFirstName: string;
  contactLastName: string;
  contactOrganization: string;
  contactTitle: string;
  contactPhone: string;
  contactEmail: string;
  contactWebsite: string;
  contactAddress: string;
  contactNote: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiEncryption: WifiEncryption;
  wifiHidden: boolean;
  wifiEapMethod: EapMethod;
  wifiEapPhase2Method: EapPhase2Method;
  wifiEapIdentity: string;
  wifiEapAnonymousIdentity: boolean;
  emailTo: string;
  emailSubject: string;
  emailBody: string;
  phoneNumber: string;
  smsNumber: string;
  smsMessage: string;
  latitude: string;
  longitude: string;
  locationLabel: string;
}

export interface QrPayloadResult {
  payload: string;
  errors: string[];
  isValid: boolean;
  label: string;
}

export function createDefaultQrContentFormState(
  overrides: Partial<QrContentFormState> = {},
): QrContentFormState {
  return {
    type: "text",
    text: "https://dmeim.com",
    websiteUrl: "https://dmeim.com",
    socialPlatform: "instagram",
    socialValue: "",
    contactFirstName: "",
    contactLastName: "",
    contactOrganization: "",
    contactTitle: "",
    contactPhone: "",
    contactEmail: "",
    contactWebsite: "",
    contactAddress: "",
    contactNote: "",
    wifiSsid: "",
    wifiPassword: "",
    wifiEncryption: "WPA",
    wifiHidden: false,
    wifiEapMethod: "PEAP",
    wifiEapPhase2Method: "MSCHAPV2",
    wifiEapIdentity: "",
    wifiEapAnonymousIdentity: false,
    emailTo: "",
    emailSubject: "",
    emailBody: "",
    phoneNumber: "",
    smsNumber: "",
    smsMessage: "",
    latitude: "",
    longitude: "",
    locationLabel: "",
    ...overrides,
  };
}

export function isQrContentType(value: string): value is QrContentType {
  return QR_CONTENT_TYPES.some((type) => type.value === value);
}

export function buildQrPayload(input: QrContentFormState): QrPayloadResult {
  switch (input.type) {
    case "website":
      return resultFromPayload(
        normalizeWebsiteUrl(input.websiteUrl),
        "Website URL",
        "Website URL is required.",
      );
    case "social":
      return resultFromPayload(
        buildSocialUrl(input.socialPlatform, input.socialValue),
        "Social media URL",
        "Profile handle or URL is required.",
      );
    case "contact":
      return buildContactPayload(input);
    case "wifi":
      return buildWifiPayload(input);
    case "email":
      return buildEmailPayload(input);
    case "phone":
      return resultFromPayload(
        compactPhoneLike(input.phoneNumber) ? `tel:${compactPhoneLike(input.phoneNumber)}` : "",
        "Phone URI",
        "Phone number is required.",
      );
    case "sms":
      return buildSmsPayload(input);
    case "location":
      return buildLocationPayload(input);
    case "text":
    default:
      return resultFromPayload(input.text.trim(), "Plain text", "Text is required.");
  }
}

export function getQrBackgroundColor(
  settings: Pick<QrCodeGeneratorSettings, "backgroundColor" | "transparentBackground">,
): string {
  return settings.transparentBackground ? "#ffffff00" : settings.backgroundColor;
}

export function clampQrSize(value: unknown): number {
  return clampInteger(value, 128, 2048, QR_DEFAULT_SIZE);
}

export function clampQrMargin(value: unknown): number {
  return clampInteger(value, 0, 10, QR_DEFAULT_MARGIN);
}

export function getQrExportBaseName(text: string): string {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return slug ? `qr-code-${slug}` : "qr-code";
}

/**
 * File name for a download. Only presets whose payload is meant to be public get a
 * slug from it: a WiFi payload would put the password in the file name.
 */
export function getQrExportBaseNameForContent(content: QrContentFormState, payload: string): string {
  if (content.type === "wifi") {
    return getQrExportBaseName(`wifi ${content.wifiSsid}`);
  }

  if (content.type === "text" || content.type === "website" || content.type === "social") {
    return getQrExportBaseName(payload);
  }

  return getQrExportBaseName(content.type);
}

/** Friendly wording for a failed render, since qrcode only throws technical messages. */
export function describeQrRenderError(error: unknown): string {
  if (error instanceof Error && /too big/i.test(error.message)) {
    return "This content is too long for a QR code. Shorten it or lower the error resistance.";
  }

  return "Could not render this QR code. Check the content and colors, then try again.";
}

export function normalizeWebsiteUrl(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function buildSocialUrl(platformId: SocialPlatformId, value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed)) {
    return trimmed;
  }

  const platform = SOCIAL_PLATFORMS.find((item) => item.value === platformId) ?? SOCIAL_PLATFORMS[0];
  const handle = trimmed.replace(/^@+/, "").replace(/^\/+/, "");

  return `${platform.baseUrl}${platform.prefix}${encodePathSegments(handle)}`;
}

function buildContactPayload(input: QrContentFormState): QrPayloadResult {
  const firstName = input.contactFirstName.trim();
  const lastName = input.contactLastName.trim();
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") || input.contactOrganization.trim();

  if (!fullName && !input.contactPhone.trim() && !input.contactEmail.trim()) {
    return invalidResult("Contact name, phone, or email is required.");
  }

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`,
    `FN:${escapeVCard(fullName || "Contact")}`,
  ];

  pushVCardLine(lines, "ORG", input.contactOrganization);
  pushVCardLine(lines, "TITLE", input.contactTitle);
  pushVCardLine(lines, "TEL;TYPE=CELL", input.contactPhone);
  pushVCardLine(lines, "EMAIL", input.contactEmail);
  pushVCardLine(lines, "URL", normalizeWebsiteUrl(input.contactWebsite));

  if (input.contactAddress.trim()) {
    lines.push(`ADR;TYPE=WORK:;;${escapeVCard(input.contactAddress.trim())};;;;`);
  }

  pushVCardLine(lines, "NOTE", input.contactNote);
  lines.push("END:VCARD");

  return validResult(lines.join("\n"), "vCard contact");
}

function buildWifiPayload(input: QrContentFormState): QrPayloadResult {
  const result = buildWifiQrPayload({
    ssid: input.wifiSsid,
    password: input.wifiPassword,
    encryption: input.wifiEncryption,
    hidden: input.wifiHidden,
    eapMethod: input.wifiEapMethod,
    eapPhase2Method: input.wifiEapPhase2Method,
    eapIdentity: input.wifiEapIdentity,
    eapAnonymousIdentity: input.wifiEapAnonymousIdentity,
  });

  return {
    payload: result.payload,
    errors: result.errors,
    isValid: result.isValid,
    label: "WiFi payload",
  };
}

function buildEmailPayload(input: QrContentFormState): QrPayloadResult {
  const email = input.emailTo.trim();

  if (!email) {
    return invalidResult("Email address is required.");
  }

  // encodeURIComponent, not URLSearchParams: mail apps show a form-encoded "+" literally (RFC 6068).
  const params = [
    ["subject", input.emailSubject.trim()],
    ["body", input.emailBody.trim()],
  ]
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value!)}`)
    .join("&");

  return validResult(`mailto:${email}${params ? `?${params}` : ""}`, "Email URI");
}

function buildSmsPayload(input: QrContentFormState): QrPayloadResult {
  const number = compactPhoneLike(input.smsNumber);

  if (!number) {
    return invalidResult("SMS number is required.");
  }

  return validResult(`SMSTO:${number}:${input.smsMessage.trim()}`, "SMS payload");
}

function buildLocationPayload(input: QrContentFormState): QrPayloadResult {
  const lat = input.latitude.trim();
  const lon = input.longitude.trim();

  if (!lat || !lon) {
    return invalidResult("Latitude and longitude are required.");
  }

  if (!isCoordinate(lat, 90)) {
    return invalidResult("Latitude must be a number between -90 and 90.");
  }

  if (!isCoordinate(lon, 180)) {
    return invalidResult("Longitude must be a number between -180 and 180.");
  }

  const label = input.locationLabel.trim();
  const query = label ? `?q=${encodeURIComponent(`${lat},${lon} (${label})`)}` : "";

  return validResult(`geo:${lat},${lon}${query}`, "Geo URI");
}

function isCoordinate(value: string, limit: number): boolean {
  return /^[+-]?\d+(\.\d+)?$/.test(value) && Math.abs(Number(value)) <= limit;
}

function resultFromPayload(payload: string, label: string, emptyMessage: string): QrPayloadResult {
  return payload ? validResult(payload, label) : invalidResult(emptyMessage, label);
}

function validResult(payload: string, label: string): QrPayloadResult {
  return { payload, errors: [], isValid: true, label };
}

function invalidResult(error: string, label = "QR payload"): QrPayloadResult {
  return { payload: "", errors: [error], isValid: false, label };
}

function pushVCardLine(lines: string[], key: string, value: string) {
  const trimmed = value.trim();

  if (trimmed) {
    lines.push(`${key}:${escapeVCard(trimmed)}`);
  }
}

function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function encodePathSegments(value: string): string {
  return value
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function compactPhoneLike(value: string): string {
  return value.trim().replace(/[^\d+]/g, "");
}

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

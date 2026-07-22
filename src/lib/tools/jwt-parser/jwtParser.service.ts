/**
 * Decode JWT header + payload (and expose the signature segment).
 * Native base64url + JSON.parse — parity with it-tools jwt-parser (jwt-decode).
 */

import {
  ALGORITHM_DESCRIPTIONS,
  CLAIM_DESCRIPTIONS,
} from "./jwtParser.constants";

export {
  ALGORITHM_DESCRIPTIONS,
  CLAIM_DESCRIPTIONS,
} from "./jwtParser.constants";

/** Sample JWT used by it-tools (HS256 demo token). */
export const DEFAULT_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export type JwtClaimRow = {
  claim: string;
  claimDescription: string | undefined;
  value: string;
  friendlyValue: string | undefined;
};

export type DecodedJwt = {
  header: JwtClaimRow[];
  payload: JwtClaimRow[];
  /** Raw base64url signature segment (third part); empty when absent. */
  signature: string;
};

/** True when header + payload decode without throwing. */
export function isValidJwt(jwt: string): boolean {
  if (jwt.length === 0) return false;
  try {
    decodeJwt({ jwt });
    return true;
  } catch {
    return false;
  }
}

/** Decode JWT segments into labeled claim rows + signature. */
export function decodeJwt({ jwt }: { jwt: string }): DecodedJwt {
  const parts = jwt.split(".");
  const rawHeaderPart = parts[0];
  const rawPayloadPart = parts[1];
  const signature = parts[2] ?? "";

  if (typeof rawHeaderPart !== "string" || rawHeaderPart.length === 0) {
    throw new Error("Invalid token specified: missing header");
  }
  if (typeof rawPayloadPart !== "string" || rawPayloadPart.length === 0) {
    throw new Error("Invalid token specified: missing payload");
  }

  const rawHeader = decodeJwtSegment(rawHeaderPart);
  const rawPayload = decodeJwtSegment(rawPayloadPart);

  return {
    header: Object.entries(rawHeader).map(([claim, value]) =>
      parseClaims({ claim, value }),
    ),
    payload: Object.entries(rawPayload).map(([claim, value]) =>
      parseClaims({ claim, value }),
    ),
    signature,
  };
}

function decodeJwtSegment(segment: string): Record<string, unknown> {
  const json = base64UrlToUtf8(segment);
  const parsed: unknown = JSON.parse(json);
  if (!isPlainObject(parsed)) {
    throw new Error("Invalid token specified: segment is not an object");
  }
  return parsed;
}

function base64UrlToUtf8(segment: string): string {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (normalized.length % 4)) % 4;
  const base64 = normalized + "=".repeat(pad);

  let binary: string;
  try {
    binary = globalThis.atob(base64);
  } catch {
    throw new Error("Invalid token specified: malformed base64url");
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function parseClaims({
  claim,
  value,
}: {
  claim: string;
  value: unknown;
}): JwtClaimRow {
  return {
    claim,
    claimDescription: CLAIM_DESCRIPTIONS[claim],
    value: formatClaimValue(value),
    friendlyValue: getFriendlyValue({ claim, value }),
  };
}

function formatClaimValue(value: unknown): string {
  if (isPlainObject(value) || Array.isArray(value)) {
    return JSON.stringify(value, null, 3);
  }
  if (value == null) return "";
  return String(value);
}

function getFriendlyValue({
  claim,
  value,
}: {
  claim: string;
  value: unknown;
}): string | undefined {
  if (["exp", "nbf", "iat"].includes(claim)) {
    return dateFormatter(value);
  }

  if (claim === "alg" && typeof value === "string") {
    return ALGORITHM_DESCRIPTIONS[value];
  }

  return undefined;
}

function dateFormatter(value: unknown): string | undefined {
  if (value == null) return undefined;
  const date = new Date(Number(value) * 1000);
  if (Number.isNaN(date.getTime())) return undefined;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

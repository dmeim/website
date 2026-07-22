import { HmacSHA1, enc } from "crypto-js";

import { createToken } from "@/lib/tools/token-generator";

export const OTP_TIME_STEP_DEFAULT = 30;
export const OTP_DIGITS_DEFAULT = 6;
export const OTP_ALGORITHM_DEFAULT = "SHA1";
export const OTP_SECRET_LENGTH = 16;
export const OTP_BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const OTP_ISSUER_DEFAULT = "IT-Tools";
export const OTP_ACCOUNT_DEFAULT = "demo-user";

export {
  generateHOTP,
  hexToBytes,
  verifyHOTP,
  generateTOTP,
  verifyTOTP,
  buildKeyUri,
  generateSecret,
  base32toHex,
  getCounterFromTime,
  isValidBase32Secret,
  generateTokenWindow,
};

function hexToBytes(hex: string): number[] {
  return (hex.match(/.{1,2}/g) ?? []).map((char) => Number.parseInt(char, 16));
}

function computeHMACSha1(message: string, key: string): string {
  return HmacSHA1(enc.Hex.parse(message), enc.Hex.parse(base32toHex(key))).toString(
    enc.Hex,
  );
}

function base32toHex(base32: string): string {
  const base32Chars = OTP_BASE32_ALPHABET;

  const bits = base32
    .toUpperCase()
    .replace(/=+$/, "")
    .split("")
    .map((value) => base32Chars.indexOf(value).toString(2).padStart(5, "0"))
    .join("");

  return (bits.match(/.{1,8}/g) ?? [])
    .map((chunk) => Number.parseInt(chunk, 2).toString(16).padStart(2, "0"))
    .join("");
}

function generateHOTP({
  key,
  counter = 0,
}: {
  key: string;
  counter?: number;
}): string {
  const digest = computeHMACSha1(counter.toString(16).padStart(16, "0"), key);
  const bytes = hexToBytes(digest);
  const offset = bytes[19]! & 0xf;
  const v =
    ((bytes[offset]! & 0x7f) << 24) |
    ((bytes[offset + 1]! & 0xff) << 16) |
    ((bytes[offset + 2]! & 0xff) << 8) |
    (bytes[offset + 3]! & 0xff);

  return String(v % 1_000_000).padStart(OTP_DIGITS_DEFAULT, "0");
}

function verifyHOTP({
  token,
  key,
  window = 0,
  counter = 0,
}: {
  token: string;
  key: string;
  window?: number;
  counter?: number;
}): boolean {
  for (let i = counter - window; i <= counter + window; i += 1) {
    if (generateHOTP({ key, counter: i }) === token) {
      return true;
    }
  }

  return false;
}

function getCounterFromTime({
  now,
  timeStep,
}: {
  now: number;
  timeStep: number;
}): number {
  return Math.floor(now / 1000 / timeStep);
}

function generateTOTP({
  key,
  now = Date.now(),
  timeStep = OTP_TIME_STEP_DEFAULT,
}: {
  key: string;
  now?: number;
  timeStep?: number;
}): string {
  const counter = getCounterFromTime({ now, timeStep });
  return generateHOTP({ key, counter });
}

function verifyTOTP({
  key,
  token,
  window = 0,
  now = Date.now(),
  timeStep = OTP_TIME_STEP_DEFAULT,
}: {
  token: string;
  key: string;
  window?: number;
  now?: number;
  timeStep?: number;
}): boolean {
  const counter = getCounterFromTime({ now, timeStep });
  return verifyHOTP({ token, key, window, counter });
}

function buildKeyUri({
  secret,
  app = OTP_ISSUER_DEFAULT,
  account = OTP_ACCOUNT_DEFAULT,
  algorithm = OTP_ALGORITHM_DEFAULT,
  digits = OTP_DIGITS_DEFAULT,
  period = OTP_TIME_STEP_DEFAULT,
}: {
  secret: string;
  app?: string;
  account?: string;
  algorithm?: string;
  digits?: number;
  period?: number;
}): string {
  const params: Record<string, string | number> = {
    issuer: app,
    secret,
    algorithm,
    digits,
    period,
  };

  const paramsString = Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");

  return `otpauth://totp/${encodeURIComponent(app)}:${encodeURIComponent(account)}?${paramsString}`;
}

function generateSecret(): string {
  return createToken({
    length: OTP_SECRET_LENGTH,
    alphabet: OTP_BASE32_ALPHABET,
  });
}

function isValidBase32Secret(value: string): boolean {
  return value.length > 0 && /^[A-Z234567]+$/i.test(value);
}

function generateTokenWindow({
  key,
  now = Date.now(),
  timeStep = OTP_TIME_STEP_DEFAULT,
}: {
  key: string;
  now?: number;
  timeStep?: number;
}): { previous: string; current: string; next: string } {
  const stepMs = timeStep * 1000;
  return {
    previous: generateTOTP({ key, now: now - stepMs, timeStep }),
    current: generateTOTP({ key, now, timeStep }),
    next: generateTOTP({ key, now: now + stepMs, timeStep }),
  };
}

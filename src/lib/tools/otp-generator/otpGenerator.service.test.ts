import { describe, expect, it } from "vitest";

import {
  OTP_BASE32_ALPHABET,
  OTP_SECRET_LENGTH,
  base32toHex,
  buildKeyUri,
  generateHOTP,
  generateSecret,
  generateTOTP,
  generateTokenWindow,
  hexToBytes,
  isValidBase32Secret,
  verifyHOTP,
  verifyTOTP,
} from "./otpGenerator.service";

describe("otp-generator service", () => {
  describe("hexToBytes", () => {
    it("converts a hex string to a byte array", () => {
      expect(hexToBytes("1")).toEqual([1]);
      expect(hexToBytes("ffffff")).toEqual([255, 255, 255]);
      expect(hexToBytes("000000000")).toEqual([0, 0, 0, 0, 0]);
      expect(hexToBytes("a3218bcef89")).toEqual([163, 33, 139, 206, 248, 9]);
      expect(hexToBytes("063679ca")).toEqual([6, 54, 121, 202]);
      expect(hexToBytes("0102030405060708090a0b0c0d0e0f")).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
      ]);
    });
  });

  describe("base32toHex", () => {
    it("converts base32 to a hex string", () => {
      expect(base32toHex("ABCDEF")).toEqual("00443205");
      expect(base32toHex("7777")).toEqual("ffff0f");
      expect(base32toHex("JBSWY3DPEHPK3PXP")).toEqual("48656c6c6f21deadbeef");
    });

    it("is case-insensitive", () => {
      expect(base32toHex("ABC")).toEqual(base32toHex("abc"));
    });
  });

  describe("generateHOTP", () => {
    it("generates HOTP codes for a given counter", () => {
      const key = "JBSWY3DPEHPK3PXP";
      const hotpCodes = ["282760", "996554", "602287", "143627", "960129"];

      for (const [counter, code] of hotpCodes.entries()) {
        expect(generateHOTP({ key, counter })).toEqual(code);
      }
    });
  });

  describe("verifyHOTP", () => {
    it("validates HOTP for a given secret", () => {
      const key = "JBSWY3DPEHPK3PXP";
      const hotpCodes = ["282760", "996554", "602287", "143627", "960129"];

      for (const [counter, token] of hotpCodes.entries()) {
        expect(verifyHOTP({ token, key, counter, window: 0 })).toEqual(true);
      }

      expect(verifyHOTP({ token: "INVALID", key })).toEqual(false);
    });

    it("does not validate HOTP out of sync", () => {
      const key = "JBSWY3DPEHPK3PXP";
      const token = "282760";

      expect(verifyHOTP({ token, key, counter: 5, window: 2 })).toEqual(false);
      expect(verifyHOTP({ token, key, counter: 5, window: 5 })).toEqual(true);
    });
  });

  describe("generateTOTP", () => {
    it("generates TOTP codes", () => {
      const key = "JBSWY3DPEHPK3PXP";

      const codes = [
        { token: "282760", now: 0 },
        { token: "341128", now: 1465324707000 },
        { token: "089029", now: 1365324707000 },
      ];

      for (const { token, now } of codes) {
        expect(generateTOTP({ key, now })).toEqual(token);
      }
    });
  });

  describe("verifyTOTP", () => {
    it("verifies in-sync TOTP codes against a key", () => {
      const key = "JBSWY3DPEHPK3PXP";

      const codes = [
        { token: "282760", now: 0 },
        { token: "341128", now: 1465324707000 },
        { token: "089029", now: 1365324707000 },
      ];

      for (const { token, now } of codes) {
        expect(verifyTOTP({ key, token, now })).toEqual(true);
      }
    });

    it("does not validate TOTP out of sync", () => {
      const key = "JBSWY3DPEHPK3PXP";
      const token = "635183";
      const now = 1661266455000;

      expect(verifyTOTP({ key, token, now, window: 2 })).toEqual(true);
      expect(verifyTOTP({ key, token, now, window: 1 })).toEqual(false);
    });
  });

  describe("buildKeyUri", () => {
    it("builds a key URI string", () => {
      expect(buildKeyUri({ secret: "JBSWY3DPEHPK3PXP" })).toEqual(
        "otpauth://totp/IT-Tools:demo-user?issuer=IT-Tools&secret=JBSWY3DPEHPK3PXP&algorithm=SHA1&digits=6&period=30",
      );

      expect(
        buildKeyUri({
          secret: "JBSWY3DPEHPK3PXP",
          app: "app-name",
          account: "account",
          algorithm: "algo",
          digits: 7,
          period: 10,
        }),
      ).toEqual(
        "otpauth://totp/app-name:account?issuer=app-name&secret=JBSWY3DPEHPK3PXP&algorithm=algo&digits=7&period=10",
      );
    });
  });

  describe("generateSecret", () => {
    it("returns a base32 secret of the expected length", () => {
      const secret = generateSecret();
      expect(secret).toHaveLength(OTP_SECRET_LENGTH);
      expect([...secret].every((ch) => OTP_BASE32_ALPHABET.includes(ch))).toBe(
        true,
      );
      expect(isValidBase32Secret(secret)).toBe(true);
    });
  });

  describe("isValidBase32Secret", () => {
    it("accepts non-empty base32 and rejects empty or invalid input", () => {
      expect(isValidBase32Secret("JBSWY3DPEHPK3PXP")).toBe(true);
      expect(isValidBase32Secret("abc")).toBe(true);
      expect(isValidBase32Secret("")).toBe(false);
      expect(isValidBase32Secret("hello!")).toBe(false);
      expect(isValidBase32Secret("1ABC")).toBe(false);
    });
  });

  describe("generateTokenWindow", () => {
    it("returns previous, current, and next tokens", () => {
      const key = "JBSWY3DPEHPK3PXP";
      const now = 1465324707000;
      const window = generateTokenWindow({ key, now });

      expect(window.current).toEqual(generateTOTP({ key, now }));
      expect(window.previous).toEqual(generateTOTP({ key, now: now - 30_000 }));
      expect(window.next).toEqual(generateTOTP({ key, now: now + 30_000 }));
    });
  });
});

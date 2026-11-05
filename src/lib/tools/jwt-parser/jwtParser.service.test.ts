import { describe, expect, it } from "vitest";

import {
  ALGORITHM_DESCRIPTIONS,
  DEFAULT_JWT,
  decodeJwt,
  isValidJwt,
} from "./jwtParser.service";

function encodeSegment(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

describe("jwt-parser", () => {
  describe("isValidJwt", () => {
    it("accepts the it-tools demo token", () => {
      expect(isValidJwt(DEFAULT_JWT)).toBe(true);
    });

    it("rejects empty and malformed values", () => {
      expect(isValidJwt("")).toBe(false);
      expect(isValidJwt("not.a.jwt")).toBe(false);
      expect(isValidJwt("only-one-part")).toBe(false);
      expect(isValidJwt("eyJhbGciOiJub25lIn0.")).toBe(false);
    });
  });

  describe("decodeJwt", () => {
    it("decodes header and payload claims from the demo token", () => {
      const decoded = decodeJwt({ jwt: DEFAULT_JWT });

      expect(decoded.header).toEqual([
        {
          claim: "alg",
          claimDescription: "Algorithm",
          value: "HS256",
          friendlyValue: ALGORITHM_DESCRIPTIONS.HS256,
        },
        {
          claim: "typ",
          claimDescription: "Type",
          value: "JWT",
          friendlyValue: undefined,
        },
      ]);

      expect(decoded.payload.map((row) => row.claim)).toEqual([
        "sub",
        "name",
        "iat",
      ]);

      const sub = decoded.payload.find((row) => row.claim === "sub")!;
      expect(sub.value).toBe("1234567890");
      expect(sub.claimDescription).toBe("Subject");

      const name = decoded.payload.find((row) => row.claim === "name")!;
      expect(name.value).toBe("John Doe");
      expect(name.claimDescription).toBe("Full name");

      const iat = decoded.payload.find((row) => row.claim === "iat")!;
      expect(iat.value).toBe("1516239022");
      expect(iat.claimDescription).toBe("Issued At");
      expect(iat.friendlyValue).toBeTruthy();
      expect(iat.friendlyValue).toMatch(/\d/);
    });

    it("exposes the raw signature segment", () => {
      const decoded = decodeJwt({ jwt: DEFAULT_JWT });
      expect(decoded.signature).toBe(
        "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
      );
    });

    it("allows tokens with an empty signature segment", () => {
      const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      const payload = btoa(JSON.stringify({ sub: "anon" }))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      const jwt = `${header}.${payload}.`;

      const decoded = decodeJwt({ jwt });
      expect(decoded.signature).toBe("");
      expect(decoded.payload[0]).toMatchObject({
        claim: "sub",
        value: "anon",
      });
      expect(decoded.header.find((row) => row.claim === "alg")?.friendlyValue).toBe(
        ALGORITHM_DESCRIPTIONS.none,
      );
    });

    it("stringifies nested objects and arrays with indent 3", () => {
      const header = btoa(JSON.stringify({ alg: "none" }))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      const payload = btoa(
        JSON.stringify({ roles: ["admin", "user"], address: { city: "NYC" } }),
      )
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const decoded = decodeJwt({ jwt: `${header}.${payload}.x` });
      const roles = decoded.payload.find((row) => row.claim === "roles")!;
      const address = decoded.payload.find((row) => row.claim === "address")!;

      expect(roles.value).toBe(JSON.stringify(["admin", "user"], null, 3));
      expect(address.value).toBe(
        JSON.stringify({ city: "NYC" }, null, 3),
      );
      expect(roles.claimDescription).toBe("Roles");
      expect(address.claimDescription).toBe("Preferred postal address");
    });

    it("decodes Unicode claims as UTF-8", () => {
      const jwt = `${encodeSegment({ alg: "none" })}.${encodeSegment({ name: "José 日本語 😀" })}.`;
      expect(decodeJwt({ jwt }).payload[0]?.value).toBe("José 日本語 😀");
    });

    it("ignores whitespace around a pasted token", () => {
      expect(decodeJwt({ jwt: `  ${DEFAULT_JWT}\n` }).signature).toBe(
        "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
      );
    });

    it("does not read descriptions from Object.prototype", () => {
      const jwt = `${encodeSegment({ alg: "constructor" })}.${encodeSegment({ constructor: "x", toString: "y" })}.`;
      const decoded = decodeJwt({ jwt });
      expect(decoded.header[0]?.friendlyValue).toBeUndefined();
      expect(decoded.payload.map((row) => row.claimDescription)).toEqual([undefined, undefined]);
    });

    it("rejects segments that are not JSON objects or valid base64url", () => {
      expect(isValidJwt(`${encodeSegment([1, 2])}.${encodeSegment({ a: 1 })}.`)).toBe(false);
      expect(isValidJwt("@@@.@@@.@@@")).toBe(false);
      expect(isValidJwt("   ")).toBe(false);
    });

    it("leaves a non-numeric date claim without a friendly value", () => {
      const jwt = `${encodeSegment({ alg: "none" })}.${encodeSegment({ exp: "soon" })}.`;
      expect(decodeJwt({ jwt }).payload[0]?.friendlyValue).toBeUndefined();
    });

    it("throws on missing segments", () => {
      expect(() => decodeJwt({ jwt: "only-one" })).toThrow(/missing payload/);
      expect(() => decodeJwt({ jwt: "" })).toThrow(/missing header/);
    });
  });
});

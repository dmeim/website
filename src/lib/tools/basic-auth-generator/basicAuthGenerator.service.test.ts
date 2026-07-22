import { describe, expect, it } from "vitest";

import {
  basicAuthCredentials,
  basicAuthHeader,
  basicAuthToken,
  textToBase64,
} from "./basicAuthGenerator.service";

describe("basic-auth-generator", () => {
  describe("textToBase64", () => {
    it("encodes ASCII strings", () => {
      expect(textToBase64("")).toBe("");
      expect(textToBase64("a")).toBe("YQ==");
      expect(textToBase64("user:pass")).toBe("dXNlcjpwYXNz");
    });

    it("encodes non-ASCII as UTF-8", () => {
      expect(textToBase64("é")).toBe("w6k=");
      expect(textToBase64("你好")).toBe("5L2g5aW9");
    });
  });

  describe("basicAuthCredentials", () => {
    it("joins username and password with a colon", () => {
      expect(basicAuthCredentials("alice", "s3cret")).toBe("alice:s3cret");
      expect(basicAuthCredentials("", "")).toBe(":");
      expect(basicAuthCredentials("user", "")).toBe("user:");
      expect(basicAuthCredentials("", "pass")).toBe(":pass");
    });

    it("preserves colons inside the password", () => {
      expect(basicAuthCredentials("u", "a:b:c")).toBe("u:a:b:c");
    });
  });

  describe("basicAuthToken", () => {
    it("base64-encodes the credential pair", () => {
      expect(basicAuthToken("user", "pass")).toBe("dXNlcjpwYXNz");
      expect(basicAuthToken("", "")).toBe("Og==");
    });
  });

  describe("basicAuthHeader", () => {
    it("builds the Authorization header line", () => {
      expect(basicAuthHeader("user", "pass")).toBe(
        "Authorization: Basic dXNlcjpwYXNz",
      );
      expect(basicAuthHeader("", "")).toBe("Authorization: Basic Og==");
      expect(basicAuthHeader("admin", "p@ss:word")).toBe(
        `Authorization: Basic ${textToBase64("admin:p@ss:word")}`,
      );
    });

    it("round-trips via atob for ASCII credentials", () => {
      const header = basicAuthHeader("demo", "secret");
      const token = header.replace(/^Authorization: Basic /, "");
      expect(globalThis.atob(token)).toBe("demo:secret");
    });
  });
});

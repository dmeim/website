import { describe, expect, it } from "vitest";

import {
  PORT_MAX,
  PORT_MIN,
  generatePort,
  isValidGeneratedPort,
} from "./randomPortGenerator.service";

describe("random-port-generator", () => {
  describe("generatePort", () => {
    it("returns an integer in [PORT_MIN, PORT_MAX)", () => {
      for (let i = 0; i < 200; i += 1) {
        const port = generatePort();
        expect(Number.isInteger(port)).toBe(true);
        expect(port).toBeGreaterThanOrEqual(PORT_MIN);
        expect(port).toBeLessThan(PORT_MAX);
      }
    });

    it("never returns a well-known port (0–1023)", () => {
      for (let i = 0; i < 100; i += 1) {
        expect(generatePort()).toBeGreaterThanOrEqual(1024);
      }
    });

    it("produces varying values across calls", () => {
      const samples = new Set(Array.from({ length: 40 }, () => generatePort()));
      expect(samples.size).toBeGreaterThan(1);
    });
  });

  describe("isValidGeneratedPort", () => {
    it("accepts integers in the generator range", () => {
      expect(isValidGeneratedPort(PORT_MIN)).toBe(true);
      expect(isValidGeneratedPort(PORT_MAX - 1)).toBe(true);
      expect(isValidGeneratedPort(8080)).toBe(true);
    });

    it("rejects out-of-range and non-integer values", () => {
      expect(isValidGeneratedPort(PORT_MAX)).toBe(false);
      expect(isValidGeneratedPort(1023)).toBe(false);
      expect(isValidGeneratedPort(0)).toBe(false);
      expect(isValidGeneratedPort(65535)).toBe(false);
      expect(isValidGeneratedPort(8080.5)).toBe(false);
      expect(isValidGeneratedPort("8080")).toBe(false);
      expect(isValidGeneratedPort(null)).toBe(false);
      expect(isValidGeneratedPort(Number.NaN)).toBe(false);
    });
  });
});

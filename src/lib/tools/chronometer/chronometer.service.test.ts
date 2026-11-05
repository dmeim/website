import { describe, expect, it } from "vitest";

import { computeElapsedMs, formatMs } from "./chronometer.service";

describe("chronometer", () => {
  describe("formatMs", () => {
    it("formats the elapsed time", () => {
      expect(formatMs(0)).toEqual("00:00.000");
      expect(formatMs(1)).toEqual("00:00.001");
      expect(formatMs(123456)).toEqual("02:03.456");
      expect(formatMs(12345600)).toEqual("03:25:45.600");
    });
  });

  describe("computeElapsedMs", () => {
    it("adds the running span to the accumulated time", () => {
      expect(computeElapsedMs(0, 1_000, 1_250)).toBe(250);
      expect(computeElapsedMs(5_000, 1_000, 1_250)).toBe(5_250);
    });

    it("counts time when no frames ran, such as in a hidden tab", () => {
      expect(computeElapsedMs(0, 1_000, 3_601_000)).toBe(3_600_000);
    });

    it("returns the accumulated time while stopped", () => {
      expect(computeElapsedMs(5_000, null, 99_999)).toBe(5_000);
    });

    it("does not go backward when the system clock does", () => {
      expect(computeElapsedMs(5_000, 2_000, 1_000)).toBe(5_000);
    });
  });
});

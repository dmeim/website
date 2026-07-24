import { describe, expect, it } from "vitest";
import { computeMeasuredThumbVars } from "./sliding-thumb";

describe("computeMeasuredThumbVars", () => {
  it("positions the thumb relative to the root left edge", () => {
    expect(
      computeMeasuredThumbVars(
        { left: 100, width: 400 },
        { left: 180, width: 64 },
      ),
    ).toEqual({ x: 80, w: 64 });
  });

  it("applies horizontal inset to x and width", () => {
    expect(
      computeMeasuredThumbVars(
        { left: 0, width: 300 },
        { left: 40, width: 80 },
        4,
      ),
    ).toEqual({ x: 44, w: 72 });
  });

  it("clamps negative inset and non-positive widths safely", () => {
    expect(
      computeMeasuredThumbVars(
        { left: 0, width: 100 },
        { left: 10, width: 6 },
        8,
      ),
    ).toEqual({ x: 18, w: 0 });

    expect(
      computeMeasuredThumbVars(
        { left: 0, width: 100 },
        { left: 10, width: 20 },
        -3,
      ),
    ).toEqual({ x: 10, w: 20 });
  });
});

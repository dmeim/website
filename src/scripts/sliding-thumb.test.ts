import { describe, expect, it } from "vitest";
import { computeMeasuredThumbVars } from "./sliding-thumb";

describe("computeMeasuredThumbVars", () => {
  it("positions the thumb relative to the root padding edge", () => {
    expect(
      computeMeasuredThumbVars(
        { left: 100, width: 400 },
        { left: 180, width: 64 },
      ),
    ).toEqual({ x: 80, w: 64 });
  });

  it("subtracts clientLeft so a bordered track does not shift the thumb", () => {
    // Border-box delta is 80; abspos origin is 1px inside → x must be 79.
    expect(
      computeMeasuredThumbVars(
        { left: 100, width: 400 },
        { left: 180, width: 64 },
        0,
        1,
      ),
    ).toEqual({ x: 79, w: 64 });
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

  it("clamps negative inset/clientLeft and non-positive widths safely", () => {
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
        -2,
      ),
    ).toEqual({ x: 10, w: 20 });
  });
});

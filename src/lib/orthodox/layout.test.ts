import { describe, expect, it } from "vitest";

import { LAYOUTS, computeLayout, iconostasisTiers } from "./layout";
import type { Box } from "./types";

const SIZES = [
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
  { width: 1024, height: 1024 },
];

function overlaps(a: Box, b: Box): boolean {
  // 1px tolerance for rounding.
  return (
    a.x + a.w - 1 > b.x &&
    b.x + b.w - 1 > a.x &&
    a.y + a.h - 1 > b.y &&
    b.y + b.h - 1 > a.y
  );
}

describe("computeLayout", () => {
  for (const layout of LAYOUTS) {
    for (const size of SIZES) {
      it(`${layout} fits 1–12 boards on ${size.width}×${size.height} without overlap`, () => {
        for (let count = 1; count <= 12; count += 1) {
          const boxes = computeLayout(layout, count, size);
          expect(boxes).toHaveLength(count);
          for (const box of boxes) {
            expect(box.w).toBeGreaterThan(0);
            expect(box.x).toBeGreaterThanOrEqual(0);
            expect(box.y).toBeGreaterThanOrEqual(0);
            expect(box.x + box.w).toBeLessThanOrEqual(size.width);
            expect(box.y + box.h).toBeLessThanOrEqual(size.height);
          }
          for (let i = 0; i < boxes.length; i += 1) {
            for (let j = i + 1; j < boxes.length; j += 1) {
              expect(overlaps(boxes[i], boxes[j])).toBe(false);
            }
          }
        }
      });
    }
  }

  it("returns nothing for an unmeasured wall", () => {
    expect(computeLayout("grid", 4, { width: 0, height: 0 })).toEqual([]);
  });

  it("puts the enlarged focal icon in slot 0 of the iconostasis", () => {
    const boxes = computeLayout("iconostasis", 5, { width: 1920, height: 1080 });
    const widest = Math.max(...boxes.map((b) => b.w));
    expect(boxes[0].w).toBe(widest);
    expect(Math.abs(boxes[0].x + boxes[0].w / 2 - 960)).toBeLessThanOrEqual(1);
  });

  it("is stable across renders for the salon wall", () => {
    const size = { width: 1600, height: 900 };
    expect(computeLayout("salon", 7, size)).toEqual(
      computeLayout("salon", 7, size),
    );
  });
});

describe("iconostasisTiers", () => {
  it("keeps up to five icons on one tier", () => {
    expect(iconostasisTiers(5)).toEqual({ lower: 5, upper: 0 });
  });

  it("gives the lower tier an odd count with a centre", () => {
    for (let count = 6; count <= 12; count += 1) {
      const { lower, upper } = iconostasisTiers(count);
      expect(lower % 2).toBe(1);
      expect(lower + upper).toBe(count);
      expect(lower).toBeGreaterThanOrEqual(upper);
    }
  });
});

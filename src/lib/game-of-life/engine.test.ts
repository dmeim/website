import { describe, expect, it } from "vitest";

import {
  countPopulation,
  createEmptyGrid,
  getCell,
  randomizeGrid,
  resizeGrid,
  setCell,
  step,
  type Grid,
} from "./engine";

function live(grid: Grid): string[] {
  const out: string[] = [];
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      if (getCell(grid, x, y) === 1) out.push(`${x},${y}`);
    }
  }
  return out;
}

describe("step", () => {
  it("flips a blinker between horizontal and vertical", () => {
    const grid = createEmptyGrid(5, 5);
    for (const x of [1, 2, 3]) setCell(grid, x, 2, true);
    const next = step(grid, createEmptyGrid(5, 5));
    expect(live(next)).toEqual(["2,1", "2,2", "2,3"]);
    expect(live(step(next, createEmptyGrid(5, 5)))).toEqual(["1,2", "2,2", "3,2"]);
  });

  it("wraps neighbours across the edges", () => {
    const grid = createEmptyGrid(6, 6);
    for (const y of [5, 0, 1]) setCell(grid, 0, y, true);
    const next = step(grid, createEmptyGrid(6, 6));
    expect(live(next)).toEqual(["0,0", "1,0", "5,0"]);
  });

  it("rejects mismatched output grids", () => {
    expect(() => step(createEmptyGrid(3, 3), createEmptyGrid(4, 3))).toThrow();
  });
});

describe("randomizeGrid", () => {
  it("fills roughly the requested share and replaces old cells", () => {
    const grid = createEmptyGrid(100, 100);
    grid.cells.fill(1);
    let seed = 1;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    randomizeGrid(grid, 0.25, random);
    const share = countPopulation(grid) / grid.cells.length;
    expect(share).toBeGreaterThan(0.2);
    expect(share).toBeLessThan(0.3);
  });

  it("clamps density to the 0 to 1 range", () => {
    const grid = createEmptyGrid(4, 4);
    randomizeGrid(grid, 2);
    expect(countPopulation(grid)).toBe(16);
    randomizeGrid(grid, -1);
    expect(countPopulation(grid)).toBe(0);
  });
});

describe("resizeGrid", () => {
  it("keeps the overlapping top-left cells", () => {
    const grid = createEmptyGrid(4, 4);
    setCell(grid, 1, 1, true);
    setCell(grid, 3, 3, true);
    expect(live(resizeGrid(grid, 2, 2))).toEqual(["1,1"]);
  });
});

/**
 * Conway's Game of Life — pure B3/S23 engine with toroidal wrapping.
 * Reusable by the interactive page and a future ambient field.
 */

export type Grid = {
  cols: number;
  rows: number;
  /** Row-major; 1 = live, 0 = dead. Length = cols * rows. */
  cells: Uint8Array;
};

export function wrap(n: number, max: number): number {
  if (max <= 0) return 0;
  return ((n % max) + max) % max;
}

export function cellIndex(cols: number, x: number, y: number): number {
  return y * cols + x;
}

export function createEmptyGrid(cols: number, rows: number): Grid {
  const c = Math.max(0, Math.floor(cols));
  const r = Math.max(0, Math.floor(rows));
  return { cols: c, rows: r, cells: new Uint8Array(c * r) };
}

export function cloneGrid(grid: Grid): Grid {
  return {
    cols: grid.cols,
    rows: grid.rows,
    cells: new Uint8Array(grid.cells),
  };
}

/** Copy overlapping cells from the old grid into a new empty grid (top-left aligned). */
export function resizeGrid(grid: Grid, cols: number, rows: number): Grid {
  const next = createEmptyGrid(cols, rows);
  const copyCols = Math.min(grid.cols, next.cols);
  const copyRows = Math.min(grid.rows, next.rows);
  for (let y = 0; y < copyRows; y++) {
    for (let x = 0; x < copyCols; x++) {
      next.cells[cellIndex(next.cols, x, y)] =
        grid.cells[cellIndex(grid.cols, x, y)] ?? 0;
    }
  }
  return next;
}

export function getCell(grid: Grid, x: number, y: number): number {
  if (grid.cols === 0 || grid.rows === 0) return 0;
  const wx = wrap(x, grid.cols);
  const wy = wrap(y, grid.rows);
  return grid.cells[cellIndex(grid.cols, wx, wy)] ?? 0;
}

/** Mutates `grid` in place. */
export function setCell(
  grid: Grid,
  x: number,
  y: number,
  alive: boolean,
): void {
  if (grid.cols === 0 || grid.rows === 0) return;
  if (x < 0 || y < 0 || x >= grid.cols || y >= grid.rows) return;
  grid.cells[cellIndex(grid.cols, x, y)] = alive ? 1 : 0;
}

export function countNeighbors(grid: Grid, x: number, y: number): number {
  let n = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      n += getCell(grid, x + dx, y + dy);
    }
  }
  return n;
}

/**
 * Advance one generation (B3/S23, toroidal).
 * Writes into `out` (must match dimensions). Returns `out`.
 */
export function step(grid: Grid, out: Grid): Grid {
  if (
    grid.cols !== out.cols ||
    grid.rows !== out.rows ||
    grid.cells.length !== out.cells.length
  ) {
    throw new Error("step: grid and out dimensions must match");
  }

  const { cols, rows, cells } = grid;
  const next = out.cells;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const neighbors = countNeighbors(grid, x, y);
      const alive = cells[cellIndex(cols, x, y)] === 1;
      // Birth on 3; survival on 2 or 3
      next[cellIndex(cols, x, y)] =
        neighbors === 3 || (alive && neighbors === 2) ? 1 : 0;
    }
  }

  return out;
}

export function countPopulation(grid: Grid): number {
  let n = 0;
  for (let i = 0; i < grid.cells.length; i++) {
    n += grid.cells[i] ?? 0;
  }
  return n;
}

/** Clear all cells in place. */
export function clearGrid(grid: Grid): void {
  grid.cells.fill(0);
}

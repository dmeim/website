/**
 * Soft gardener for ambient Game of Life — keeps the field alive without
 * hard resets. Detects low population, still lifes, and short oscillations,
 * then injects random live cells until the field has quiet energy again.
 */

import {
  cellIndex,
  countPopulation,
  type Grid,
} from "./engine";

export type GardenerConfig = {
  /** Minimum live cells as a fraction of total cells (0–1). */
  minPopulationRatio: number;
  /** Absolute floor so tiny grids still get a kick. */
  minPopulationAbsolute: number;
  /** Cells to attempt injecting per gardener pass. */
  injectBatchSize: number;
  /** Unchanged grid for this many checks → inject. */
  stillLifeGenerations: number;
  /** Detect oscillation periods from 2..maxPeriod. */
  maxOscillationPeriod: number;
  /** Generations spent in a short cycle before injecting. */
  oscillationGenerations: number;
  /** How many recent hashes to retain for cycle detection. */
  hashHistorySize: number;
};

export type GardenerState = {
  lastHash: number;
  unchangedCount: number;
  /** Ring of recent grid hashes (newest last). */
  hashHistory: number[];
  /** Consecutive generations that matched a short cycle. */
  oscillationStreak: number;
};

export const DEFAULT_GARDENER_CONFIG: GardenerConfig = {
  /** Keep enough live cells that a soft ambient field stays readable. */
  minPopulationRatio: 0.06,
  minPopulationAbsolute: 80,
  injectBatchSize: 64,
  stillLifeGenerations: 8,
  maxOscillationPeriod: 6,
  oscillationGenerations: 16,
  hashHistorySize: 16,
};

export function createGardenerState(): GardenerState {
  return {
    lastHash: NaN,
    unchangedCount: 0,
    hashHistory: [],
    oscillationStreak: 0,
  };
}

/** Fast non-crypto hash of the cell buffer (FNV-1a 32-bit). */
export function hashGrid(grid: Grid): number {
  let h = 0x811c9dc5;
  const { cells } = grid;
  for (let i = 0; i < cells.length; i++) {
    h ^= cells[i] ?? 0;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Random sparse seed — unique per load when using Math.random. */
export function seedSparse(
  grid: Grid,
  density: number,
  rng: () => number = Math.random,
): void {
  const d = Math.min(1, Math.max(0, density));
  for (let i = 0; i < grid.cells.length; i++) {
    grid.cells[i] = rng() < d ? 1 : 0;
  }
}

/**
 * Flip dead cells to live at random positions. Returns how many were injected.
 * Prefers empty cells; may under-deliver if the grid is nearly full.
 */
export function injectRandomCells(
  grid: Grid,
  count: number,
  rng: () => number = Math.random,
): number {
  if (count <= 0 || grid.cells.length === 0) return 0;

  const { cols, rows, cells } = grid;
  let injected = 0;
  const attempts = count * 8;

  for (let a = 0; a < attempts && injected < count; a++) {
    const x = Math.floor(rng() * cols);
    const y = Math.floor(rng() * rows);
    const i = cellIndex(cols, x, y);
    if (cells[i] === 0) {
      cells[i] = 1;
      injected++;
    }
  }

  return injected;
}

function populationThreshold(grid: Grid, config: GardenerConfig): number {
  const ratioFloor = Math.floor(grid.cells.length * config.minPopulationRatio);
  return Math.max(config.minPopulationAbsolute, ratioFloor);
}

/** True when the newest hash history shows a repeating period of length `period`. */
export function detectsPeriod(history: readonly number[], period: number): boolean {
  if (period < 2 || history.length < period * 2) return false;
  const start = history.length - period * 2;
  for (let i = 0; i < period; i++) {
    if (history[start + i] !== history[start + period + i]) return false;
  }
  return true;
}

function shortCycleDetected(
  history: readonly number[],
  maxPeriod: number,
): boolean {
  for (let p = 2; p <= maxPeriod; p++) {
    if (detectsPeriod(history, p)) return true;
  }
  return false;
}

function needsInjection(
  grid: Grid,
  state: GardenerState,
  config: GardenerConfig,
): boolean {
  const pop = countPopulation(grid);
  if (pop < populationThreshold(grid, config)) return true;
  if (state.unchangedCount >= config.stillLifeGenerations) return true;
  if (state.oscillationStreak >= config.oscillationGenerations) return true;
  return false;
}

/**
 * After a generation settles, update stall/cycle trackers and inject if needed.
 * Mutates `grid` when injecting. Returns the next gardener state.
 */
export function tendGarden(
  grid: Grid,
  state: GardenerState,
  config: GardenerConfig = DEFAULT_GARDENER_CONFIG,
  rng: () => number = Math.random,
): GardenerState {
  const hash = hashGrid(grid);

  const unchangedCount =
    hash === state.lastHash && !Number.isNaN(state.lastHash)
      ? state.unchangedCount + 1
      : 0;

  const hashHistory = [...state.hashHistory, hash];
  while (hashHistory.length > config.hashHistorySize) {
    hashHistory.shift();
  }

  const inCycle = shortCycleDetected(hashHistory, config.maxOscillationPeriod);
  const oscillationStreak = inCycle ? state.oscillationStreak + 1 : 0;

  let next: GardenerState = {
    lastHash: hash,
    unchangedCount,
    hashHistory,
    oscillationStreak,
  };

  if (!needsInjection(grid, next, config)) return next;

  const batch = Math.max(
    config.injectBatchSize,
    Math.ceil(grid.cells.length * 0.02),
  );
  injectRandomCells(grid, batch, rng);

  // Reset trackers after a kick so we don't thrash every frame.
  return {
    lastHash: hashGrid(grid),
    unchangedCount: 0,
    hashHistory: [],
    oscillationStreak: 0,
  };
}

import type { Box, Size } from "./types";

export const PRESET_LAYOUTS = ["iconostasis", "row", "grid", "salon"] as const;
export type PresetLayout = (typeof PRESET_LAYOUTS)[number];

/** "custom" is hand-built cards (see custom.ts); the presets are computed here. */
export const LAYOUTS = [...PRESET_LAYOUTS, "custom"] as const;
export type WallLayout = (typeof LAYOUTS)[number];

export const LAYOUT_LABELS: Record<WallLayout, string> = {
  iconostasis: "Iconostasis",
  row: "Row",
  grid: "Grid",
  salon: "Salon",
  custom: "Custom",
};

/** Icon boards are portrait panels; height = width × BOARD_ASPECT. */
export const BOARD_ASPECT = 4 / 3;

const ICONOSTASIS_CENTER_SCALE = 1.3;
const ICONOSTASIS_UPPER_SCALE = 0.72;
const ROW_MAX_HEIGHT = 0.7;

type Frame = { gap: number; availW: number; availH: number };

function frameFor({ width, height }: Size): Frame {
  const unit = Math.min(width, height);
  const pad = unit * 0.08;
  return {
    gap: unit * 0.045,
    availW: width - pad * 2,
    availH: height - pad * 2,
  };
}

/** Lay boards out left to right, centred on (cx, cy). */
function placeRow(
  widths: number[],
  gap: number,
  cx: number,
  cy: number,
): Box[] {
  const rowW =
    widths.reduce((sum, w) => sum + w, 0) + gap * (widths.length - 1);
  let x = cx - rowW / 2;
  return widths.map((w) => {
    const h = w * BOARD_ASPECT;
    const box = { x, y: cy - h / 2, w, h };
    x += w + gap;
    return box;
  });
}

function gridLayout(count: number, size: Size): Box[] {
  const { gap, availW, availH } = frameFor(size);
  let best = { cols: 1, rows: count, w: 0 };
  for (let cols = 1; cols <= count; cols += 1) {
    const rows = Math.ceil(count / cols);
    const w = Math.min(
      (availW - gap * (cols - 1)) / cols,
      (availH - gap * (rows - 1)) / rows / BOARD_ASPECT,
    );
    if (w > best.w) best = { cols, rows, w };
  }

  const { cols, rows, w } = best;
  const h = w * BOARD_ASPECT;
  const totalH = rows * h + gap * (rows - 1);
  const top = (size.height - totalH) / 2;
  const boxes: Box[] = [];
  for (let r = 0; r < rows; r += 1) {
    const inRow = Math.min(cols, count - r * cols);
    const cy = top + r * (h + gap) + h / 2;
    boxes.push(...placeRow(Array(inRow).fill(w), gap, size.width / 2, cy));
  }
  return boxes;
}

function rowLayout(count: number, size: Size): Box[] {
  const { gap, availW, availH } = frameFor(size);
  const w = Math.min(
    (availW - gap * (count - 1)) / count,
    (availH * ROW_MAX_HEIGHT) / BOARD_ASPECT,
  );
  return placeRow(
    Array(count).fill(w),
    gap,
    size.width / 2,
    size.height * 0.47,
  );
}

/** Split into a lower tier (odd, with an enlarged centre) and a smaller upper tier. */
export function iconostasisTiers(count: number): {
  lower: number;
  upper: number;
} {
  if (count <= 5) return { lower: count, upper: 0 };
  const half = Math.ceil(count / 2);
  const lower = half % 2 === 0 ? half + 1 : half;
  return { lower, upper: count - lower };
}

/** Base board width for a lower tier plus `upper` small boards in `cols` columns above it. */
function iconostasisWidth(
  frame: Frame,
  lowerUnits: number,
  lower: number,
  tallest: number,
  upper: number,
  cols: number,
): number {
  const { gap, availW, availH } = frame;
  const rows = upper > 0 ? Math.ceil(upper / cols) : 0;
  const s = ICONOSTASIS_UPPER_SCALE;
  const constraints = [
    (availW - gap * (lower - 1)) / lowerUnits,
    (availH - rows * gap) / (BOARD_ASPECT * (tallest + rows * s)),
  ];
  if (upper > 0) constraints.push((availW - gap * (cols - 1)) / (cols * s));
  return Math.min(...constraints);
}

function iconostasisLayout(count: number, size: Size): Box[] {
  const frame = frameFor(size);
  const { gap } = frame;
  const portrait = size.width < size.height;
  // Narrow walls keep a three-icon base and stack the rest above it.
  const { lower, upper } = portrait
    ? { lower: Math.min(count, 3), upper: Math.max(count - 3, 0) }
    : iconostasisTiers(count);
  const center = lower >= 3 && lower % 2 === 1 ? (lower - 1) / 2 : -1;
  const lowerScales = Array.from({ length: lower }, (_, i) =>
    i === center ? ICONOSTASIS_CENTER_SCALE : 1,
  );
  const lowerUnits = lowerScales.reduce((sum, s) => sum + s, 0);
  const tallest = center >= 0 ? ICONOSTASIS_CENTER_SCALE : 1;

  let cols = upper;
  let w = iconostasisWidth(frame, lowerUnits, lower, tallest, upper, cols);
  if (portrait) {
    for (let c = 1; c < upper; c += 1) {
      const candidate = iconostasisWidth(
        frame,
        lowerUnits,
        lower,
        tallest,
        upper,
        c,
      );
      if (candidate > w) {
        w = candidate;
        cols = c;
      }
    }
  }

  const rows = upper > 0 ? Math.ceil(upper / cols) : 0;
  const lowerH = w * tallest * BOARD_ASPECT;
  const upperW = w * ICONOSTASIS_UPPER_SCALE;
  const upperH = upperW * BOARD_ASPECT;
  const totalH = lowerH + rows * (upperH + gap);
  const top = (size.height - totalH) / 2;
  const cx = size.width / 2;

  const lowerBoxes = placeRow(
    lowerScales.map((s) => s * w),
    gap,
    cx,
    top + rows * (upperH + gap) + lowerH / 2,
  );
  // Centre board first so slot 0 is always the focal icon.
  const ordered =
    center >= 0
      ? [lowerBoxes[center], ...lowerBoxes.filter((_, i) => i !== center)]
      : lowerBoxes;
  const upperBoxes: Box[] = [];
  for (let r = 0; r < rows; r += 1) {
    const inRow = Math.min(cols, upper - r * cols);
    const cy = top + r * (upperH + gap) + upperH / 2;
    upperBoxes.push(...placeRow(Array(inRow).fill(upperW), gap, cx, cy));
  }
  return [...ordered, ...upperBoxes];
}

/** Deterministic 0–1 noise so the salon wall doesn't jump between renders. */
function hash01(n: number): number {
  const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
}

function salonLayout(count: number, size: Size): Box[] {
  return gridLayout(count, size).map((box, i) => {
    const scale = 0.7 + hash01(i + 1) * 0.3;
    const w = box.w * scale;
    const h = box.h * scale;
    return {
      x: box.x + (box.w - w) * hash01(i + 101),
      y: box.y + (box.h - h) * hash01(i + 211),
      w,
      h,
    };
  });
}

/** Pixel boxes for `count` boards hung on a wall of `size`. */
export function computeLayout(
  layout: PresetLayout,
  count: number,
  size: Size,
): Box[] {
  if (count < 1 || size.width <= 0 || size.height <= 0) return [];
  const boxes =
    layout === "grid"
      ? gridLayout(count, size)
      : layout === "row"
        ? rowLayout(count, size)
        : layout === "salon"
          ? salonLayout(count, size)
          : iconostasisLayout(count, size);
  return boxes.map(({ x, y, w, h }) => ({
    x: Math.round(x),
    y: Math.round(y),
    w: Math.round(w),
    h: Math.round(h),
  }));
}

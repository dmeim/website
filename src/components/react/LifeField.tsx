import { useEffect, useRef } from "react";

import {
  createEmptyGrid,
  resizeGrid,
  step,
  type Grid,
} from "@/lib/game-of-life/engine";
import {
  createGardenerState,
  seedSparse,
  tendGarden,
  type GardenerState,
} from "@/lib/game-of-life/gardener";

/** Match GlyphField spacing energy — soft ambient, not a hard grid. */
const CELL_SIZE = 12;
const DPR_CAP = 2;
/** Calm ambient pace — a few generations per second, not 60fps Life. */
const STEP_MS = 300;
/** Dense enough to read as a field (wave paints ~every cell; Life is sparse). */
const SEED_DENSITY = 0.16;
const CELL_RADIUS = 2.1;
/** Light ground needs stronger ink; dark can stay softer. */
const ALPHA_LIGHT = 0.10;
const ALPHA_DARK = 0.10;

function isLightTheme(): boolean {
  return document.documentElement.getAttribute("data-theme") === "light";
}

function readInkRgb(): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-ink")
    .trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
    const n = parseInt(raw.slice(1), 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  }
  // Prefer dark ink fallback so light theme never gets invisible pale dots.
  return isLightTheme() ? "12, 14, 18" : "236, 234, 230";
}

function cellAlpha(): number {
  return isLightTheme() ? ALPHA_LIGHT : ALPHA_DARK;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function dimsFromViewport(): { cols: number; rows: number } {
  const cols = Math.max(1, Math.floor(window.innerWidth / CELL_SIZE));
  const rows = Math.max(1, Math.floor(window.innerHeight / CELL_SIZE));
  return { cols, rows };
}

/**
 * Ambient Conway field — low-alpha dots, soft gardener, random seed per load.
 * Decorative only; paused under reduced motion / hidden tab.
 */
export default function LifeField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let grid: Grid = createEmptyGrid(1, 1);
    let buffer: Grid = createEmptyGrid(1, 1);
    let gardener: GardenerState = createGardenerState();
    let inkRgb = readInkRgb();
    let alpha = cellAlpha();
    let rafId = 0;
    let running = false;
    let reduced = prefersReducedMotion();
    let resizeTimer = 0;
    let lastStepAt = 0;

    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ensureGrid = (reseed: boolean) => {
      const { cols, rows } = dimsFromViewport();
      if (reseed || grid.cols !== cols || grid.rows !== rows) {
        if (!reseed && grid.cells.length > 1) {
          grid = resizeGrid(grid, cols, rows);
        } else {
          grid = createEmptyGrid(cols, rows);
          seedSparse(grid, SEED_DENSITY);
        }
        buffer = createEmptyGrid(cols, rows);
        gardener = createGardenerState();
      }
    };

    const drawFrame = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const { cols, rows, cells } = grid;
      ctx.fillStyle = `rgba(${inkRgb}, ${alpha})`;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (cells[y * cols + x] !== 1) continue;
          const cx = x * CELL_SIZE + CELL_SIZE * 0.5;
          const cy = y * CELL_SIZE + CELL_SIZE * 0.5;
          ctx.beginPath();
          ctx.arc(cx, cy, CELL_RADIUS, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const advance = (now: number) => {
      if (now - lastStepAt >= STEP_MS) {
        lastStepAt = now;
        step(grid, buffer);
        const tmp = grid;
        grid = buffer;
        buffer = tmp;
        gardener = tendGarden(grid, gardener);
      }
      drawFrame();
    };

    const tick = (now: number) => {
      advance(now);
      if (running) rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || reduced || document.hidden) return;
      running = true;
      lastStepAt = performance.now();
      rafId = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const paintStatic = () => {
      stop();
      drawFrame();
    };

    const syncMotion = () => {
      reduced = prefersReducedMotion();
      if (reduced || document.hidden) paintStatic();
      else start();
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        sizeCanvas();
        ensureGrid(false);
        if (reduced || document.hidden) paintStatic();
      }, 100);
    };

    const onVisibility = () => {
      if (document.hidden) paintStatic();
      else syncMotion();
    };

    const themeObserver = new MutationObserver(() => {
      inkRgb = readInkRgb();
      alpha = cellAlpha();
      if (reduced || document.hidden || !running) paintStatic();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => syncMotion();
    motionMq.addEventListener("change", onMotionChange);

    sizeCanvas();
    ensureGrid(true);
    syncMotion();

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      motionMq.removeEventListener("change", onMotionChange);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="glyph-field"
      aria-hidden="true"
    />
  );
}

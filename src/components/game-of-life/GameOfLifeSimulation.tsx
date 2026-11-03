import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  clearGrid,
  countPopulation,
  createEmptyGrid,
  randomizeGrid,
  resizeGrid,
  setCell,
  step,
  type Grid,
} from "@/lib/game-of-life/engine";

import { Button } from "@/ui/react/Button";
import { IconButton } from "@/ui/react/IconButton";
import { ImmersiveStage } from "@/ui/react/ImmersiveStage";
import { Slider } from "@/ui/react/Slider";
import { Toolbar } from "@/ui/react/Toolbar";

import "./GameOfLifeSimulation.css";

const CELL_SIZE = 12;
const DPR_CAP = 2;
const MIN_FPS = 1;
const MAX_FPS = 60;
const DEFAULT_FPS = 8;
const SEED_DENSITY = 0.14;

const formatCount = new Intl.NumberFormat("en-US");

/** Keys on these targets keep their native meaning (activate, type, slide). */
const NATIVE_KEY_TARGETS = "input, select, textarea, button, a[href], [role='toolbar']";

function readCssColor(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return raw || fallback;
}

function gridFromSize(width: number, height: number, previous?: Grid): Grid {
  const cols = Math.max(1, Math.floor(width / CELL_SIZE));
  const rows = Math.max(1, Math.floor(height / CELL_SIZE));
  if (previous && previous.cols === cols && previous.rows === rows) {
    return previous;
  }
  if (previous) return resizeGrid(previous, cols, rows);
  return createEmptyGrid(cols, rows);
}

function cellFromPointer(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  cols: number,
  rows: number,
): { x: number; y: number } | null {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const x = Math.floor(((clientX - rect.left) / rect.width) * cols);
  const y = Math.floor(((clientY - rect.top) / rect.height) * rows);
  if (x < 0 || y < 0 || x >= cols || y >= rows) return null;
  return { x, y };
}

export function GameOfLifeSimulation() {
  const shellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Grid>(createEmptyGrid(1, 1));
  const bufferRef = useRef<Grid>(createEmptyGrid(1, 1));
  const seededRef = useRef(false);
  const runningRef = useRef(false);
  const fpsRef = useRef(DEFAULT_FPS);
  const lastTickRef = useRef(0);
  const rafRef = useRef(0);
  const paintModeRef = useRef<"live" | "dead" | null>(null);
  const lastPaintRef = useRef<{ x: number; y: number } | null>(null);

  const [running, setRunning] = useState(false);
  const [fps, setFps] = useState(DEFAULT_FPS);
  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const shell = shellRef.current;
    if (!canvas || !shell) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const grid = gridRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const cssW = shell.clientWidth;
    const cssH = shell.clientHeight;
    if (cssW <= 0 || cssH <= 0) return;

    // Reassigning the backing size clears and reallocates the bitmap, so only
    // do it when the stage actually changed size.
    const pxW = Math.floor(cssW * dpr);
    const pxH = Math.floor(cssH * dpr);
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW;
      canvas.height = pxH;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = readCssColor("--ui-canvas-bg", "#f6f4ef");
    ctx.fillRect(0, 0, cssW, cssH);

    const cellW = cssW / grid.cols;
    const cellH = cssH / grid.rows;

    ctx.strokeStyle = readCssColor("--ui-canvas-grid", "rgb(23 22 20 / 6%)");
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= grid.cols; x++) {
      const px = Math.round(x * cellW) + 0.5;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, cssH);
    }
    for (let y = 0; y <= grid.rows; y++) {
      const py = Math.round(y * cellH) + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(cssW, py);
    }
    ctx.stroke();

    ctx.fillStyle = readCssColor("--ui-canvas-cell", "#171614");
    for (let y = 0; y < grid.rows; y++) {
      for (let x = 0; x < grid.cols; x++) {
        if (grid.cells[y * grid.cols + x] !== 1) continue;
        ctx.fillRect(
          Math.round(x * cellW) + 1,
          Math.round(y * cellH) + 1,
          Math.max(1, Math.round(cellW) - 2),
          Math.max(1, Math.round(cellH) - 2),
        );
      }
    }
  }, []);

  const syncStats = useCallback(() => {
    setPopulation(countPopulation(gridRef.current));
  }, []);

  const resizeToShell = useCallback(() => {
    const shell = shellRef.current;
    if (!shell || shell.clientWidth <= 0 || shell.clientHeight <= 0) return;
    const next = gridFromSize(
      shell.clientWidth,
      shell.clientHeight,
      gridRef.current,
    );
    // Open on a random soup so the board reads as a board, not a blank page.
    if (!seededRef.current) {
      randomizeGrid(next, SEED_DENSITY);
      seededRef.current = true;
    }
    gridRef.current = next;
    bufferRef.current = createEmptyGrid(next.cols, next.rows);
    syncStats();
    draw();
  }, [draw, syncStats]);

  /** Advance one generation in place, swapping the double buffer. */
  const advance = useCallback(() => {
    const current = gridRef.current;
    if (
      bufferRef.current.cols !== current.cols ||
      bufferRef.current.rows !== current.rows
    ) {
      bufferRef.current = createEmptyGrid(current.cols, current.rows);
    }
    step(current, bufferRef.current);
    gridRef.current = bufferRef.current;
    bufferRef.current = current;
    setGeneration((g) => g + 1);
    syncStats();
    draw();
  }, [draw, syncStats]);

  const toggleRun = useCallback(() => {
    if (!runningRef.current) lastTickRef.current = performance.now();
    setRunning((value) => !value);
  }, []);

  const stepOnce = useCallback(() => {
    setRunning(false);
    advance();
  }, [advance]);

  const handleRandom = () => {
    randomizeGrid(gridRef.current, SEED_DENSITY);
    setGeneration(0);
    syncStats();
    draw();
  };

  const handleClear = () => {
    setRunning(false);
    clearGrid(gridRef.current);
    setGeneration(0);
    syncStats();
    draw();
  };

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    fpsRef.current = fps;
  }, [fps]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    resizeToShell();

    const ro = new ResizeObserver(() => {
      resizeToShell();
    });
    ro.observe(shell);

    const themeObserver = new MutationObserver(() => {
      draw();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      ro.disconnect();
      themeObserver.disconnect();
    };
  }, [draw, resizeToShell]);

  useEffect(() => {
    const tick = (now: number) => {
      if (runningRef.current) {
        const interval =
          1000 / Math.min(MAX_FPS, Math.max(MIN_FPS, fpsRef.current));
        if (now - lastTickRef.current >= interval) {
          lastTickRef.current = now;
          advance();
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [advance]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.closest(NATIVE_KEY_TARGETS)) return;
      if (event.key === " ") {
        event.preventDefault();
        toggleRun();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        stepOnce();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleRun, stepOnce]);

  const paintAt = useCallback(
    (clientX: number, clientY: number, mode: "live" | "dead") => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const grid = gridRef.current;
      const cell = cellFromPointer(
        canvas,
        clientX,
        clientY,
        grid.cols,
        grid.rows,
      );
      if (!cell) return;
      const last = lastPaintRef.current;
      if (last && last.x === cell.x && last.y === cell.y) return;
      lastPaintRef.current = cell;
      setCell(grid, cell.x, cell.y, mode === "live");
      syncStats();
      draw();
    },
    [draw, syncStats],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (event.button === 0) {
      paintModeRef.current = "live";
    } else if (event.button === 2) {
      paintModeRef.current = "dead";
    } else {
      return;
    }

    lastPaintRef.current = null;
    canvas.setPointerCapture(event.pointerId);
    paintAt(event.clientX, event.clientY, paintModeRef.current);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!paintModeRef.current) return;
    paintAt(event.clientX, event.clientY, paintModeRef.current);
  };

  const endPaint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    paintModeRef.current = null;
    lastPaintRef.current = null;
    if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }
  };

  // The slider sits outside the toolbar so its arrow keys move the value
  // instead of the toolbar's roving focus.
  const dock = (
    <div className="gol-sim__dock">
      <Toolbar label="Simulation controls" className="gol-sim__toolbar">
        <IconButton
          icon="arrow-left"
          label="Back to Game of Life"
          href="/game-of-life"
          size="sm"
        />
        <span className="gol-sim__divider" aria-hidden="true" />
        <Button
          size="sm"
          variant="primary"
          iconStart={running ? "pause" : "play"}
          aria-keyshortcuts="Space"
          className="gol-sim__run"
          onClick={toggleRun}
        >
          {running ? "Pause" : "Start"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          iconStart="skip-forward"
          aria-keyshortcuts="ArrowRight"
          className="gol-sim__action"
          onClick={stepOnce}
        >
          Step
        </Button>
        <Button
          size="sm"
          variant="ghost"
          iconStart="shuffle"
          className="gol-sim__action"
          onClick={handleRandom}
        >
          Random
        </Button>
        <Button
          size="sm"
          variant="ghost"
          iconStart="eraser"
          className="gol-sim__action"
          onClick={handleClear}
        >
          Clear
        </Button>
      </Toolbar>
      <div className="gol-sim__readout">
        <dl className="gol-sim__stats">
          <div className="gol-sim__stat">
            <dt>Generation</dt>
            <dd>{formatCount.format(generation)}</dd>
          </div>
          <div className="gol-sim__stat">
            <dt>Population</dt>
            <dd>{formatCount.format(population)}</dd>
          </div>
        </dl>
        <Slider
          id="gol-sim-fps"
          className="gol-sim__speed"
          label="Speed"
          min={MIN_FPS}
          max={MAX_FPS}
          step={1}
          value={fps}
          onChange={(value) => setFps(Array.isArray(value) ? value[1] : value)}
          showValue
          formatValue={(value) => `${value} fps`}
        />
      </div>
    </div>
  );

  return (
    <ImmersiveStage
      label="Game of Life simulation"
      className="gol-sim"
      data-running={running ? "true" : "false"}
      toolbar={dock}
    >
      <div ref={shellRef} className="gol-sim__stage">
        <canvas
          ref={canvasRef}
          className="gol-sim__canvas"
          role="img"
          aria-label="Game of Life board. Click or drag to draw cells, right-click to erase."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPaint}
          onPointerCancel={endPaint}
          onContextMenu={(event) => event.preventDefault()}
        />
      </div>
    </ImmersiveStage>
  );
}

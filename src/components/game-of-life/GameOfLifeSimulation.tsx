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
  resizeGrid,
  setCell,
  step,
  type Grid,
} from "@/lib/game-of-life/engine";

import "./GameOfLifeSimulation.css";

const CELL_SIZE = 12;
const DPR_CAP = 2;
const MIN_FPS = 1;
const MAX_FPS = 60;
const DEFAULT_FPS = 8;

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

export default function GameOfLifeSimulation() {
  const shellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Grid>(createEmptyGrid(1, 1));
  const bufferRef = useRef<Grid>(createEmptyGrid(1, 1));
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

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const elevated = readCssColor("--color-surface", "#0e1014");
    const accent = readCssColor("--color-gold", "#d4bc8a");
    const border = readCssColor("--color-border", "#0e1014");

    ctx.fillStyle = elevated;
    ctx.fillRect(0, 0, cssW, cssH);

    const cellW = cssW / grid.cols;
    const cellH = cssH / grid.rows;

    ctx.strokeStyle = border;
    ctx.globalAlpha = 0.35;
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
    ctx.globalAlpha = 1;

    ctx.fillStyle = accent;
    for (let y = 0; y < grid.rows; y++) {
      for (let x = 0; x < grid.cols; x++) {
        if (grid.cells[y * grid.cols + x] !== 1) continue;
        const px = x * cellW;
        const py = y * cellH;
        ctx.fillRect(
          Math.floor(px) + 1,
          Math.floor(py) + 1,
          Math.max(1, Math.ceil(cellW) - 2),
          Math.max(1, Math.ceil(cellH) - 2),
        );
      }
    }
  }, []);

  const syncStats = useCallback(() => {
    setPopulation(countPopulation(gridRef.current));
  }, []);

  const resizeToShell = useCallback(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const next = gridFromSize(
      shell.clientWidth,
      shell.clientHeight,
      gridRef.current,
    );
    gridRef.current = next;
    bufferRef.current = createEmptyGrid(next.cols, next.rows);
    syncStats();
    draw();
  }, [draw, syncStats]);

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
          1000 /
          Math.min(MAX_FPS, Math.max(MIN_FPS, fpsRef.current));
        if (now - lastTickRef.current >= interval) {
          lastTickRef.current = now;
          const current = gridRef.current;
          const buffer = bufferRef.current;
          if (
            buffer.cols !== current.cols ||
            buffer.rows !== current.rows
          ) {
            bufferRef.current = createEmptyGrid(current.cols, current.rows);
          }
          step(current, bufferRef.current);
          gridRef.current = bufferRef.current;
          bufferRef.current = current;
          setGeneration((g) => g + 1);
          setPopulation(countPopulation(gridRef.current));
          draw();
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

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

  const handleToggleRun = () => {
    if (running) {
      setRunning(false);
      return;
    }
    lastTickRef.current = performance.now();
    setRunning(true);
  };

  const handleStep = () => {
    setRunning(false);
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
  };

  const handleClear = () => {
    setRunning(false);
    clearGrid(gridRef.current);
    setGeneration(0);
    syncStats();
    draw();
  };

  return (
    <div className="gol-sim" data-running={running ? "true" : "false"}>
      <div className="gol-sim__bar" role="toolbar" aria-label="Simulation controls">
        <div className="gol-sim__bar-left">
          <a className="gol-sim__exit" href="/game-of-life">
            Exit
          </a>
          <div className="gol-sim__actions">
            <button
              type="button"
              className={running ? "btn" : "btn btn--primary"}
              onClick={handleToggleRun}
              aria-pressed={running}
            >
              {running ? "Pause" : "Start"}
            </button>
            <button type="button" className="btn" onClick={handleStep}>
              Step
            </button>
            <button
              type="button"
              className="btn gol-sim__clear"
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
        </div>

        <dl className="gol-sim__stats">
          <div>
            <dt>Generation</dt>
            <dd>{generation}</dd>
          </div>
          <div>
            <dt>Population</dt>
            <dd>{population}</dd>
          </div>
        </dl>

        <div className="gol-sim__speed">
          <label htmlFor="gol-sim-fps">
            Speed
            <span className="gol-sim__fps-value">{fps} FPS</span>
          </label>
          <input
            id="gol-sim-fps"
            type="range"
            min={MIN_FPS}
            max={MAX_FPS}
            step={1}
            value={fps}
            onChange={(event) => setFps(Number(event.target.value))}
            aria-valuetext={`${fps} frames per second`}
          />
        </div>
      </div>

      <div
        ref={shellRef}
        className="gol-sim__stage"
        aria-label="Game of Life board. Left-click to place cells, right-click to erase."
      >
        <canvas
          ref={canvasRef}
          className="gol-sim__canvas"
          role="img"
          aria-label="Game of Life grid"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPaint}
          onPointerCancel={endPaint}
          onContextMenu={(event) => event.preventDefault()}
        />
      </div>
    </div>
  );
}

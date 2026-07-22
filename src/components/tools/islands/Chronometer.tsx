import { useCallback, useEffect, useRef, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolHint,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
} from "@/components/tools/ui";
import { formatMs } from "@/lib/tools/chronometer";

import "./Chronometer.css";

export default function Chronometer() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const previousRafDate = useRef(Date.now());
  const rafId = useRef<number | null>(null);

  const stopRaf = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const now = Date.now();
    const deltaMs = now - previousRafDate.current;
    previousRafDate.current = now;
    setElapsedMs((prev) => prev + deltaMs);
    rafId.current = requestAnimationFrame(tick);
  }, []);

  const resume = useCallback(() => {
    previousRafDate.current = Date.now();
    setIsRunning(true);
    stopRaf();
    rafId.current = requestAnimationFrame(tick);
  }, [stopRaf, tick]);

  const pause = useCallback(() => {
    stopRaf();
    setIsRunning(false);
  }, [stopRaf]);

  const reset = useCallback(() => {
    setElapsedMs(0);
  }, []);

  useEffect(() => () => stopRaf(), [stopRaf]);

  return (
    <ToolIsland className="chrono-tool">
      <ToolPanel labelledBy="chrono-heading" className="chrono-tool__panel">
        <ToolSectionHeading
          title="Chronometer"
          titleId="chrono-heading"
          description={
            <ToolHint>
              Monitor the duration of a thing — start, stop, and reset a simple
              stopwatch.
            </ToolHint>
          }
        />

        <div
          className="chrono-duration"
          role="timer"
          aria-live="off"
          aria-atomic="true"
          data-testid="chrono-duration"
        >
          {formatMs(elapsedMs)}
        </div>

        <ToolActionRow
          className="chrono-actions"
          aria-label="Chronometer controls"
          animate
        >
          {isRunning ? (
            <ToolButton
              type="button"
              variant="danger"
              onClick={pause}
              data-testid="chrono-stop"
            >
              Stop
            </ToolButton>
          ) : (
            <ToolButton
              type="button"
              variant="primary"
              onClick={resume}
              data-testid="chrono-start"
            >
              Start
            </ToolButton>
          )}
          <ToolButton
            type="button"
            onClick={reset}
            data-testid="chrono-reset"
          >
            Reset
          </ToolButton>
        </ToolActionRow>
      </ToolPanel>
    </ToolIsland>
  );
}

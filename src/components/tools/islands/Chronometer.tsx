import { useCallback, useEffect, useRef, useState } from "react";

import { Button, ButtonGroup, Panel, Stat, ToolFrame } from "@/ui/react";
import { formatMs } from "@/lib/tools/chronometer";

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
    <ToolFrame>
      <Panel
        title="Chronometer"
        titleId="chrono-heading"
        description="Monitor the duration of a thing: start, stop, and reset a simple stopwatch."
      >
        <Stat
          label="Elapsed"
          value={formatMs(elapsedMs)}
          size="xl"
          mono
          role="timer"
          aria-live="off"
          aria-atomic="true"
          data-testid="chrono-duration"
        />

        <ButtonGroup label="Chronometer controls">
          {isRunning ? (
            <Button
              variant="danger"
              iconStart="pause"
              pressed
              onClick={pause}
              data-testid="chrono-stop"
            >
              Stop
            </Button>
          ) : (
            <Button
              variant="primary"
              iconStart="play"
              onClick={resume}
              data-testid="chrono-start"
            >
              Start
            </Button>
          )}
          <Button iconStart="arrows-clockwise" onClick={reset} data-testid="chrono-reset">
            Reset
          </Button>
        </ButtonGroup>
      </Panel>
    </ToolFrame>
  );
}

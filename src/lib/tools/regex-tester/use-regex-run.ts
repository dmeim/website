import { useEffect, useRef, useState } from "react";

import { EMPTY_REGEX_RUN, runRegex, type RegexRunRequest, type RegexRunResult } from "./regexTester.service";

/** A catastrophic pattern can only be stopped by killing the thread it runs on. */
export const REGEX_TIMEOUT_MS = 1500;

export type RegexRunState = {
  result: RegexRunResult;
  timedOut: boolean;
};

const IDLE: RegexRunState = { result: EMPTY_REGEX_RUN, timedOut: false };

function spawnWorker(): Worker | null {
  try {
    return new Worker(new URL("./regexTester.worker.ts", import.meta.url), { type: "module" });
  } catch {
    return null;
  }
}

/** Runs the regex in a worker and gives up after REGEX_TIMEOUT_MS. `request` null means nothing to run. */
export function useRegexRun(request: RegexRunRequest | null): RegexRunState {
  const [state, setState] = useState<RegexRunState>(IDLE);
  const workerRef = useRef<{ worker: Worker; ready: boolean; busy: boolean } | null>(null);
  const { regex, text, flags } = request ?? {};

  useEffect(() => {
    const stopWorker = () => {
      workerRef.current?.worker.terminate();
      workerRef.current = null;
    };

    // Still busy means the previous pattern is stuck, and the new one would queue behind it forever.
    if (workerRef.current?.busy) stopWorker();

    if (regex === undefined || text === undefined || flags === undefined) {
      setState(IDLE);
      return;
    }
    const current = { regex, text, flags };

    if (!workerRef.current) {
      const worker = spawnWorker();
      if (!worker) {
        setState({ result: runRegex(current), timedOut: false });
        return;
      }
      workerRef.current = { worker, ready: false, busy: false };
    }

    const entry = workerRef.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startTimer = () => {
      timer = setTimeout(() => {
        stopWorker();
        setState({ result: EMPTY_REGEX_RUN, timedOut: true });
      }, REGEX_TIMEOUT_MS);
    };

    entry.busy = true;
    if (entry.ready) startTimer();

    entry.worker.onmessage = (event: MessageEvent<{ type: "ready" } | { type: "result"; result: RegexRunResult }>) => {
      if (event.data.type === "ready") {
        entry.ready = true;
        startTimer();
        return;
      }
      clearTimeout(timer);
      entry.busy = false;
      setState({ result: event.data.result, timedOut: false });
    };

    entry.worker.onerror = () => {
      clearTimeout(timer);
      const loaded = entry.ready;
      stopWorker();
      // A worker that never loaded says nothing about the regex. One that crashed mid-run ran out of memory.
      setState(loaded ? { result: EMPTY_REGEX_RUN, timedOut: true } : { result: runRegex(current), timedOut: false });
    };

    entry.worker.postMessage(current);

    return () => clearTimeout(timer);
  }, [regex, text, flags]);

  useEffect(
    () => () => {
      workerRef.current?.worker.terminate();
      workerRef.current = null;
    },
    [],
  );

  return state;
}

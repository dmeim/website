/** Pausable auto-dismiss timer for toasts. */
export interface ToastTimer {
  pause(): void;
  resume(): void;
  clear(): void;
}

export function createToastTimer(duration: number, onDone: () => void): ToastTimer {
  let remaining = duration;
  let started = 0;
  let handle: ReturnType<typeof setTimeout> | undefined;
  const resume = () => {
    if (duration <= 0 || handle !== undefined) return;
    started = Date.now();
    handle = setTimeout(onDone, remaining);
  };
  const pause = () => {
    if (handle === undefined) return;
    clearTimeout(handle);
    handle = undefined;
    remaining = Math.max(0, remaining - (Date.now() - started));
  };
  resume();
  return { pause, resume, clear: pause };
}

import { useCallback, useEffect, useRef, useState } from "react";

const POKE_THROTTLE_MS = 400;

/**
 * Calls `onClose` after `ms` without activity while `open`. `cycle` changes on
 * every reset so a countdown indicator can restart its animation.
 */
export function useAutoClose(open: boolean, onClose: () => void, ms: number) {
  const [cycle, setCycle] = useState(0);
  const lastPoke = useRef(0);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => closeRef.current(), ms);
    return () => window.clearTimeout(timer);
  }, [open, cycle, ms]);

  const poke = useCallback(() => {
    const now = Date.now();
    if (now - lastPoke.current < POKE_THROTTLE_MS) return;
    lastPoke.current = now;
    setCycle((n) => n + 1);
  }, []);

  return { cycle, poke };
}

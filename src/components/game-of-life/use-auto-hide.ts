import { useEffect, useState } from "react";

const WAKE_EVENTS = ["pointermove", "pointerdown", "keydown", "wheel"] as const;
const WAKE_THROTTLE_MS = 400;

/**
 * True once there has been no pointer or keyboard activity for `ms`. `cycle`
 * changes on every wake so a countdown indicator can restart its animation.
 */
export function useAutoHide(ms: number) {
  const [hidden, setHidden] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    let timer = 0;
    let lastWake = -Infinity;
    function wake() {
      const now = performance.now();
      if (now - lastWake < WAKE_THROTTLE_MS) return;
      lastWake = now;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setHidden(true), ms);
      setHidden(false);
      setCycle((n) => n + 1);
    }
    wake();
    for (const type of WAKE_EVENTS) {
      window.addEventListener(type, wake, { passive: true });
    }
    return () => {
      window.clearTimeout(timer);
      for (const type of WAKE_EVENTS) window.removeEventListener(type, wake);
    };
  }, [ms]);

  return { hidden, cycle };
}

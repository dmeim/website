import { useEffect, useState } from "react";

const WAKE_EVENTS = ["pointermove", "pointerdown", "keydown", "wheel"] as const;

/** True once there has been no pointer or keyboard activity for `ms`. */
export function useIdle(ms: number): boolean {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    let timer = 0;
    function wake() {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), ms);
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

  return idle;
}

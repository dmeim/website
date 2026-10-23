/**
 * One passive scroll/resize listener feeding every scroll-linked effect,
 * so all of them read layout and write styles in the same animation frame.
 */
import { prefersReducedMotion } from "../shared/concept-runtime";

type FrameCallback = () => void;

const callbacks = new Set<FrameCallback>();
let scheduled = false;
let bound = false;

function flush(): void {
  scheduled = false;
  callbacks.forEach((callback) => callback());
}

function schedule(): void {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(flush);
}

export function onScrollFrame(callback: FrameCallback): () => void {
  callbacks.add(callback);
  if (!bound) {
    bound = true;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
  }
  schedule();
  return () => callbacks.delete(callback);
}

export function requestScrollFrame(): void {
  schedule();
}

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

export function motionAllowed(): boolean {
  return !prefersReducedMotion();
}

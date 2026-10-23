/** Motion values mirroring tokens.css for React (motion/framer) code. */

export const uiEase = [0.2, 0, 0, 1] as const;

export const uiDur = {
  instant: 0.08,
  fast: 0.16,
  base: 0.24,
  slow: 0.36,
  glide: 0.32,
} as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: uiDur.slow, ease: uiEase } },
} as const;

/** Container variants that stagger children by 40ms. */
export function stagger(step = 0.04, delayChildren = 0) {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: step, delayChildren } },
  } as const;
}

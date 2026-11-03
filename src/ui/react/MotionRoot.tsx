import { domAnimation, LazyMotion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Loads Framer Motion's lighter feature set (animations, variants, exit,
 * gestures, in-view) for the `m` components beneath it: about half the size
 * of the full `motion` bundle. Nesting is cheap, so library components wrap
 * themselves and islands need no setup.
 */
export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

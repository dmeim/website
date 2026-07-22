import type { Transition, Variants } from "framer-motion";

/** Matches site Reveal / global --ease-out curve. */
export const TOOL_EASE = [0.22, 1, 0.36, 1] as const;

export const toolTransition: Transition = {
  duration: 0.55,
  ease: TOOL_EASE,
};

export const toolPanelTransition: Transition = {
  duration: 0.65,
  ease: TOOL_EASE,
};

/** Soft fade-up for tool panels and action rows. */
export const toolFadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

/** Slightly stronger entrance for primary panels. */
export const toolPanelReveal: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/** Stagger children inside a workspace. */
export const toolStagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

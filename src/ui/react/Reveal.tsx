import { m, useReducedMotion } from "framer-motion";
import { MotionRoot } from "./MotionRoot";
import type { HTMLAttributes, ReactNode, Ref } from "react";
import { fadeUp, uiDur, uiEase } from "@/ui/lib/motion";

type RevealTag = "div" | "section" | "ul" | "ol" | "li" | "article" | "span" | "header" | "p";

export type RevealProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode;
  as?: RevealTag;
  /** Seconds. */
  delay?: number;
  /** Pixels travelled upward; defaults to the token reveal distance. */
  y?: number;
  once?: boolean;
  ref?: Ref<HTMLElement>;
};

/** Token-driven scroll reveal; static when reduced motion is requested. */
export function Reveal({ as: Tag = "div", delay = 0, y = fadeUp.hidden.y, once = true, children, ...rest }: RevealProps) {
  const reduced = useReducedMotion();
  if (reduced) return <Tag {...(rest as HTMLAttributes<HTMLElement>)}>{children}</Tag>;

  const MotionTag = m[Tag] as typeof m.div;
  return (
    <MotionRoot>
      <MotionTag
        {...(rest as object)}
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once, margin: "0px 0px -10% 0px" }}
        transition={{ duration: uiDur.slow, ease: uiEase, delay }}
      >
        {children}
      </MotionTag>
    </MotionRoot>
  );
}

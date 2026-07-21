import { motion, useReducedMotion } from "framer-motion";
import "./TextReveal.css";

type TextRevealTag = "h1" | "h2" | "h3" | "p" | "span";

type TextRevealProps = {
  text: string;
  as?: TextRevealTag;
  className?: string;
  delay?: number;
  once?: boolean;
  id?: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

const motionTags = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  span: motion.span,
} as const;

export function TextReveal({
  text,
  as = "p",
  className,
  delay = 0,
  once = true,
  id,
}: TextRevealProps) {
  const reduced = useReducedMotion();
  const words = text.trim().split(/\s+/).filter(Boolean);
  const MotionTag = motionTags[as];

  if (reduced) {
    const StaticTag = as;
    return (
      <StaticTag id={id} className={className}>
        {text}
      </StaticTag>
    );
  }

  return (
    <MotionTag
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-10%" }}
      aria-label={text}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="text-reveal__clip"
          aria-hidden="true"
        >
          <motion.span
            className="text-reveal__word"
            variants={{
              hidden: { y: "115%" },
              visible: {
                y: "0%",
                transition: {
                  duration: 0.7,
                  ease: EASE,
                  delay: delay + i * 0.045,
                },
              },
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}

export type { TextRevealProps, TextRevealTag };

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
} from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";

export type PhotoTiltIntensity = "main" | "medium" | "low";

export type PhotoTiltProps = {
  children: ReactNode;
  className?: string;
  /** Defaults to `medium` (5°). Hero uses `main` (10°). `low` (3°) is reserved. */
  intensity?: PhotoTiltIntensity;
  /** Force-disable tilt even when hover is available. */
  enabled?: boolean;
  style?: CSSProperties;
} & Omit<
  HTMLMotionProps<"div">,
  "children" | "style" | "onPointerMove" | "onPointerLeave"
>;

const INTENSITY_DEGREES: Record<PhotoTiltIntensity, number> = {
  main: 10,
  medium: 5,
  low: 3,
};

const SPRING = { stiffness: 160, damping: 10, mass: 0.33 };
const PERSPECTIVE = 1200;

function useCanHover() {
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setCanHover(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return canHover;
}

export function PhotoTilt({
  children,
  className,
  intensity = "medium",
  enabled = true,
  style,
  ...motionProps
}: PhotoTiltProps) {
  const reduced = useReducedMotion();
  const canHover = useCanHover();
  const tiltActive = enabled && !Boolean(reduced) && canHover;
  const ref = useRef<HTMLDivElement>(null);
  const degrees = INTENSITY_DEGREES[intensity];

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const springTiltX = useSpring(tiltX, SPRING);
  const springTiltY = useSpring(tiltY, SPRING);

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!tiltActive || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    tiltY.set(px * degrees);
    tiltX.set(py * -degrees);
  }

  function onPointerLeave() {
    tiltX.set(0);
    tiltY.set(0);
  }

  return (
    <motion.div
      className={className}
      style={
        tiltActive
          ? {
              transformStyle: "preserve-3d",
              ...style,
              rotateX: springTiltX,
              rotateY: springTiltY,
              transformPerspective: PERSPECTIVE,
            }
          : style
      }
      onPointerMove={tiltActive ? onPointerMove : undefined}
      onPointerLeave={tiltActive ? onPointerLeave : undefined}
      {...motionProps}
      ref={ref}
    >
      {children}
    </motion.div>
  );
}

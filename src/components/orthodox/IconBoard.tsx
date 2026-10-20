import { AnimatePresence, motion } from "framer-motion";
import type {
  CSSProperties,
  KeyboardEventHandler,
  PointerEventHandler,
  ReactNode,
} from "react";

import type { BoardBorder } from "@/lib/orthodox/settings";
import type { Box, OrthodoxImage } from "@/lib/orthodox/types";

export type BoardEdit = {
  label: string;
  dragging: boolean;
  /** Neighbouring cards tilt in opposite directions. */
  phase: 0 | 1;
  handlers: {
    onPointerDown: PointerEventHandler<HTMLElement>;
    onPointerMove: PointerEventHandler<HTMLElement>;
    onPointerUp: PointerEventHandler<HTMLElement>;
    onPointerCancel: PointerEventHandler<HTMLElement>;
    onKeyDown: KeyboardEventHandler<HTMLElement>;
  };
};

type IconBoardProps = {
  box: Box;
  image?: OrthodoxImage;
  border: BoardBorder;
  /** Present while the custom wall is being arranged. */
  edit?: BoardEdit;
  children?: ReactNode;
};

const MOVE = { duration: 0.9, ease: [0.22, 1, 0.36, 1] } as const;
const SNAP = { duration: 0.12, ease: "easeOut" } as const;

// Tilt and lift go through motion, not CSS `rotate`/`scale`, so they compose
// after the x/y translate and pivot on the card's centre.
const JIGGLE_DEG = 0.4;
const JIGGLE = {
  duration: 0.45,
  ease: "easeInOut",
  repeat: Infinity,
  repeatType: "mirror",
} as const;
const SETTLE = { duration: 0.2 } as const;

/** One icon on its wooden panel; the painting cross-fades when rotated. */
export function IconBoard({
  box,
  image,
  border,
  edit,
  children,
}: IconBoardProps) {
  const geometry = { x: box.x, y: box.y, width: box.w, height: box.h };
  // Frame thickness follows the short side so wide cards don't get heavy rails.
  const frame = Math.min(box.w, box.h * 0.75);
  const jiggling = Boolean(edit && !edit.dragging);
  const tilt = edit?.phase === 1 ? -JIGGLE_DEG : JIGGLE_DEG;

  return (
    <motion.figure
      className="ow-board"
      data-border={border}
      data-editing={edit ? true : undefined}
      data-dragging={edit?.dragging || undefined}
      style={{ "--board-w": `${frame}px` } as CSSProperties}
      initial={{ ...geometry, opacity: 0 }}
      animate={{
        ...geometry,
        opacity: 1,
        rotate: jiggling ? [-tilt, tilt] : 0,
        scale: edit?.dragging ? 1.03 : 1,
      }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      transition={{
        ...(edit ? SNAP : MOVE),
        rotate: jiggling ? JIGGLE : SETTLE,
        scale: SETTLE,
      }}
      tabIndex={edit ? 0 : undefined}
      aria-label={edit?.label}
      aria-roledescription={edit ? "movable card" : undefined}
      {...edit?.handlers}
    >
      <div className="ow-board__ark">
        <AnimatePresence initial={false}>
          {image ? (
            <motion.img
              key={image.id}
              className="ow-board__img"
              src={image.src}
              alt={image.title}
              draggable={false}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            />
          ) : null}
        </AnimatePresence>
      </div>
      {children}
    </motion.figure>
  );
}

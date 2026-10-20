import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import {
  GRID,
  moveCard,
  resizeCard,
  sameGeometry,
  type CustomCard,
} from "@/lib/orthodox/custom";
import type { Size } from "@/lib/orthodox/types";

type Gesture = {
  mode: "move" | "resize";
  x: number;
  y: number;
  start: CustomCard;
};

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/**
 * Drag a card to move it, drag `[data-resize]` inside it to resize. Arrow
 * keys nudge one grid step (Shift resizes), Delete removes, Enter opens the
 * lock picker.
 */
export function useCardGesture(
  card: CustomCard,
  size: Size,
  actions: {
    onChange: (card: CustomCard) => void;
    onRemove: () => void;
    onPick: () => void;
  },
) {
  const gesture = useRef<Gesture | null>(null);
  const [active, setActive] = useState(false);

  function apply(next: CustomCard) {
    if (!sameGeometry(next, card)) actions.onChange(next);
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    const target = event.target as Element;
    if (target.closest("button")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      mode: target.closest("[data-resize]") ? "resize" : "move",
      x: event.clientX,
      y: event.clientY,
      start: card,
    };
    setActive(true);
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const g = gesture.current;
    if (!g) return;
    const dx = Math.round(((event.clientX - g.x) / size.width) * GRID);
    const dy = Math.round(((event.clientY - g.y) / size.height) * GRID);
    apply(
      g.mode === "move"
        ? moveCard(g.start, dx, dy)
        : resizeCard(g.start, dx, dy),
    );
  }

  function onPointerEnd() {
    gesture.current = null;
    setActive(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) return;
    const arrow = ARROWS[event.key];
    if (arrow) {
      event.preventDefault();
      const [dx, dy] = arrow;
      apply(event.shiftKey ? resizeCard(card, dx, dy) : moveCard(card, dx, dy));
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      actions.onRemove();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      actions.onPick();
    }
  }

  return {
    active,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
      onKeyDown,
    },
  };
}

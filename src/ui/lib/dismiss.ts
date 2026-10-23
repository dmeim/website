import { useEffect, type RefObject } from "react";

/** Closes an open overlay on outside pointerdown (outside `wrapper`) and on Escape. */
export function useDismiss(
  open: boolean,
  wrapper: RefObject<HTMLElement | null>,
  onDismiss: (reason: "outside" | "escape") => void,
): void {
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (wrapper.current && !wrapper.current.contains(event.target as Node)) onDismiss("outside");
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss("escape");
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, wrapper, onDismiss]);
}

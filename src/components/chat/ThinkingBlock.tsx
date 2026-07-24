import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type TouchEvent,
  type WheelEvent,
} from "react";

/** Must be essentially at the bottom to re-engage stickiness. */
const LOCK_BOTTOM_PX = 8;
/** Any scroll farther than this from the bottom releases stickiness. */
const UNLOCK_BOTTOM_PX = 16;

type ThinkingBlockProps = {
  text: string;
  streaming?: boolean;
};

function distanceFromBottom(el: HTMLElement): number {
  return el.scrollHeight - el.scrollTop - el.clientHeight;
}

export function ThinkingBlock({ text, streaming = false }: ThinkingBlockProps) {
  const panelId = useId();
  const [open, setOpen] = useState(streaming);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);
  const wasStreamingRef = useRef(streaming);
  const touchYRef = useRef<number | null>(null);

  useEffect(() => {
    const wasStreaming = wasStreamingRef.current;
    wasStreamingRef.current = streaming;

    if (streaming) {
      setOpen(true);
      stickToBottomRef.current = true;
      return;
    }

    // Collapse only when thinking finishes — stay closed until the user opens it.
    if (wasStreaming && !streaming) {
      setOpen(false);
    }
  }, [streaming]);

  useLayoutEffect(() => {
    if (!open || !streaming || !stickToBottomRef.current) return;
    const el = bodyRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [text, open, streaming]);

  const syncStickFromScroll = () => {
    const el = bodyRef.current;
    if (!el) return;
    const distance = distanceFromBottom(el);
    if (distance <= LOCK_BOTTOM_PX) {
      stickToBottomRef.current = true;
    } else if (distance > UNLOCK_BOTTOM_PX) {
      stickToBottomRef.current = false;
    }
  };

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    // Unlock immediately on upward intent so the next stream tick can't yank back.
    if (event.deltaY < 0) {
      stickToBottomRef.current = false;
    }
  };

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchYRef.current = event.touches[0]?.clientY ?? null;
  };

  const onTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const y = event.touches[0]?.clientY;
    const prev = touchYRef.current;
    if (y == null || prev == null) return;
    // Finger moving down → content scrolls up → release stick.
    if (y > prev + 2) {
      stickToBottomRef.current = false;
    }
    touchYRef.current = y;
  };

  const onTouchEnd = () => {
    touchYRef.current = null;
    syncStickFromScroll();
  };

  if (!text.trim()) return null;

  return (
    <div
      className={
        streaming
          ? "chat-thinking-block chat-thinking-block--streaming"
          : "chat-thinking-block"
      }
    >
      <button
        type="button"
        className="chat-thinking-block__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="chat-thinking-block__chevron" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
        <span className="chat-thinking-block__title">
          {streaming ? "Thinking…" : "Thinking"}
        </span>
      </button>
      {open ? (
        <div
          id={panelId}
          ref={bodyRef}
          className="chat-thinking-block__body"
          onScroll={syncStickFromScroll}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <pre className="chat-thinking-block__text">{text}</pre>
        </div>
      ) : null}
    </div>
  );
}

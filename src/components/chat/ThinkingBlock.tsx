import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

const NEAR_BOTTOM_PX = 48;

type ThinkingBlockProps = {
  text: string;
  streaming?: boolean;
};

export function ThinkingBlock({ text, streaming = false }: ThinkingBlockProps) {
  const panelId = useId();
  const [open, setOpen] = useState(streaming);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);
  const wasStreamingRef = useRef(streaming);

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

  const onBodyScroll = () => {
    const el = bodyRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distance < NEAR_BOTTOM_PX;
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
          onScroll={onBodyScroll}
        >
          <pre className="chat-thinking-block__text">{text}</pre>
        </div>
      ) : null}
    </div>
  );
}

import { useDeferredValue, useEffect, useMemo, useRef } from "react";

import { renderMarkdownBlocks } from "@/lib/chat/markdown";

type Props = {
  text: string;
  className?: string;
};

export default function MarkdownBody({ text, className }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  // Tokens arrive faster than a frame while streaming; deferring lets React
  // drop intermediate values instead of parsing every single chunk.
  const deferredText = useDeferredValue(text);
  const blocks = useMemo(
    () => renderMarkdownBlocks(deferredText),
    [deferredText],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onClick = async (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest("[data-chat-copy]");
      if (!(button instanceof HTMLButtonElement) || !root.contains(button)) {
        return;
      }
      const block = button.closest(".chat-code");
      const code = block?.querySelector("code");
      const value = code?.textContent ?? "";
      try {
        await navigator.clipboard.writeText(value);
        button.textContent = "Copied";
        window.setTimeout(() => {
          button.textContent = "Copy";
        }, 1200);
      } catch {
        button.textContent = "Failed";
        window.setTimeout(() => {
          button.textContent = "Copy";
        }, 1200);
      }
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
    // Delegated from the stable root, so it survives block-level updates.
  }, []);

  return (
    <div ref={rootRef} className={className}>
      {blocks.map((html, index) => (
        <div
          // Blocks are append-only while streaming, so the index is stable.
          key={index}
          className="chat-md-block"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ))}
    </div>
  );
}

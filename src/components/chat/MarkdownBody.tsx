import { useDeferredValue, useEffect, useMemo, useRef } from "react";

import { renderMarkdownBlocks } from "@/lib/chat/markdown";
import { copyTextToClipboard } from "@/ui/lib/clipboard";
import { cx } from "@/ui/lib/cx";

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
      if (!(target instanceof Element)) return;
      const button = target.closest("[data-chat-copy]");
      if (!(button instanceof HTMLButtonElement) || !root.contains(button)) {
        return;
      }
      // The button also carries the library's `data-copy` contract; stop here so
      // the document-level copy delegate does not write the clipboard a second time.
      event.stopPropagation();
      const value =
        button.closest(".chat-code")?.querySelector("pre")?.textContent ?? "";
      const reset = (label: string, state: string) => {
        button.textContent = label;
        button.dataset.state = state;
      };
      try {
        await copyTextToClipboard(value);
        reset("Copied", "copied");
      } catch (error) {
        console.error("[chat] code copy failed", error);
        reset("Failed", "idle");
      }
      window.clearTimeout(Number(button.dataset.timer));
      button.dataset.timer = String(
        window.setTimeout(() => reset("Copy", "idle"), 1600),
      );
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
    // Delegated from the stable root, so it survives block-level updates.
  }, []);

  return (
    <div ref={rootRef} className={cx("ui-prose chat-prose", className)} data-size="md">
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

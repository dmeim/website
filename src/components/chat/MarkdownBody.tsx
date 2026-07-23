import { useEffect, useMemo, useRef } from "react";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

const defaultFence =
  md.renderer.rules.fence ??
  ((tokens, idx, options, _env, self) =>
    self.renderToken(tokens, idx, options));

md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]!;
  const info = (token.info || "").trim();
  const lang = info.split(/\s+/g)[0] || "";
  const raw = defaultFence(tokens, idx, options, env, self);
  const label = lang || "code";
  return `<div class="chat-code" data-lang="${md.utils.escapeHtml(label)}"><div class="chat-code__bar"><span class="chat-code__lang">${md.utils.escapeHtml(label)}</span><button type="button" class="chat-code__copy" data-chat-copy>Copy</button></div>${raw}</div>`;
};

type Props = {
  text: string;
  className?: string;
};

export default function MarkdownBody({ text, className }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const html = useMemo(() => md.render(text || ""), [text]);

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
  }, [html]);

  return (
    <div
      ref={rootRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

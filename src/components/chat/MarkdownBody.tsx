import { useMemo } from "react";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

type Props = {
  text: string;
  className?: string;
};

export default function MarkdownBody({ text, className }: Props) {
  const html = useMemo(() => md.render(text || ""), [text]);
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

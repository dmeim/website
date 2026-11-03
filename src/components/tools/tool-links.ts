import type { MouseEvent } from "react";
import type { Tool } from "@/content/tools";

export function toolMatches(tool: Tool, query: string): boolean {
  if (!query) return true;
  const hay = `${tool.title} ${tool.description} ${(tool.tags ?? []).join(" ")}`.toLowerCase();
  return hay.includes(query);
}

/** Plain left clicks are handled in-app; modified clicks keep native link behaviour. */
export function isPlainClick(event: MouseEvent<HTMLElement>): boolean {
  return !(
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

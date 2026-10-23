import { useId } from "react";

let counter = 0;

/** Unique id for Astro-rendered markup (unique per render pass). */
export function createId(prefix = "ui"): string {
  counter += 1;
  return `${prefix}-${counter.toString(36)}`;
}

/** React id that prefers an explicit id; colon-free so it works in selectors. */
export function useStableId(explicit?: string, prefix = "ui"): string {
  const generated = useId().replace(/:/g, "");
  return explicit ?? `${prefix}-${generated}`;
}

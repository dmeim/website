/** Shared helpers for the field wrapper contract (spec §4.3). */

export type FieldLayout = "stack" | "inline";
export type FieldSpan = "auto" | "full";
export type ControlSize = "sm" | "md" | "lg";

export function fieldHintId(id: string): string {
  return `${id}-hint`;
}

export function fieldErrorId(id: string): string {
  return `${id}-error`;
}

/** True when a control should render inside a Field. */
export function needsField(label?: unknown, hint?: unknown, error?: unknown): boolean {
  return Boolean(label || hint || error);
}

/** Merges hint/error ids with any caller-provided aria-describedby. */
export function describedBy(
  id: string,
  hint?: unknown,
  error?: unknown,
  extra?: string | null,
): string | undefined {
  const ids = [extra, hint ? fieldHintId(id) : null, error ? fieldErrorId(id) : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

/** Percentage of `value` along `[min, max]`, clamped to 0–100. */
export function rangePct(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

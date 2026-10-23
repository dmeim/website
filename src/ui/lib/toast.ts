/** Framework-free toast bus (spec §4.5 #42). Toaster renders what it hears. */

export type ToastTone = "neutral" | "info" | "success" | "warning" | "danger" | "accent";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  message: string;
  tone?: ToastTone;
  action?: ToastAction;
  /** Milliseconds before auto-dismiss; 0 keeps it until dismissed. */
  duration?: number;
}

export interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
  action?: ToastAction;
  duration: number;
}

export type ToastEvent =
  | { type: "add"; toast: ToastItem }
  | { type: "dismiss"; id: string };

export type ToastListener = (event: ToastEvent) => void;

export const DEFAULT_TOAST_DURATION = 5000;

const listeners = new Set<ToastListener>();
let counter = 0;

export function toast(options: ToastOptions): string {
  counter += 1;
  const item: ToastItem = {
    id: `ui-toast-${counter}`,
    message: options.message,
    tone: options.tone ?? "neutral",
    action: options.action,
    duration: options.duration ?? DEFAULT_TOAST_DURATION,
  };
  listeners.forEach((listener) => listener({ type: "add", toast: item }));
  return item.id;
}

export function dismiss(id: string): void {
  listeners.forEach((listener) => listener({ type: "dismiss", id }));
}

export function subscribe(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Toasts are cloned from the <template> rendered by Toaster.astro so their
 * markup (and Lucide icons) stay server-authored.
 */
import { prefersReducedMotion } from "../../shared/concept-runtime";

export type ToastOptions = {
  title: string;
  body?: string;
  duration?: number;
};

function dismiss(toast: HTMLElement): void {
  if (toast.dataset.state === "leaving") return;
  toast.dataset.state = "leaving";
  const remove = () => toast.remove();
  if (prefersReducedMotion()) return remove();
  toast.addEventListener("transitionend", remove, { once: true });
  window.setTimeout(remove, 400);
}

export function showToast({ title, body, duration = 4000 }: ToastOptions): void {
  const region = document.querySelector<HTMLElement>("[data-toast-region]");
  const template = document.querySelector<HTMLTemplateElement>("[data-toast-template]");
  if (!region || !template) return;

  const fragment = template.content.cloneNode(true) as DocumentFragment;
  const toast = fragment.querySelector<HTMLElement>(".toast");
  if (!toast) return;
  toast.querySelector("[data-toast-title]")!.textContent = title;
  const bodyEl = toast.querySelector<HTMLElement>("[data-toast-body]")!;
  if (body) bodyEl.textContent = body;
  else bodyEl.remove();

  // Older toasts make room so the stack never grows past three.
  const existing = [...region.querySelectorAll<HTMLElement>(".toast:not([data-state='leaving'])")];
  existing.slice(0, Math.max(0, existing.length - 2)).forEach(dismiss);

  region.append(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => (toast.dataset.state = "open")));

  let timer = window.setTimeout(() => dismiss(toast), duration);
  toast.addEventListener("pointerenter", () => window.clearTimeout(timer));
  toast.addEventListener("pointerleave", () => {
    timer = window.setTimeout(() => dismiss(toast), 1500);
  });
  toast.querySelector("[data-toast-close]")?.addEventListener("click", () => dismiss(toast));
}

/** DOM renderer for the Astro Toaster: subscribes once to the toast bus. */
import { dismiss, subscribe, type ToastItem } from "./toast";
import { createToastTimer } from "./toast-timer";

let unsubscribe: (() => void) | null = null;

function render(root: HTMLElement, item: ToastItem): HTMLElement | null {
  const template = root.querySelector<HTMLTemplateElement>("template[data-ui-toast-template]");
  const li = template?.content.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
  if (!li) return null;
  li.dataset.tone = item.tone;
  li.dataset.id = item.id;
  const icon = root.querySelector<HTMLTemplateElement>(`template[data-ui-toast-icon="${item.tone}"]`);
  const svg = icon?.content.firstElementChild?.cloneNode(true);
  if (svg) li.insertBefore(svg, li.firstChild);
  li.querySelector(".ui-toast__message")!.textContent = item.message;
  const action = li.querySelector<HTMLButtonElement>(".ui-toast__action");
  if (action && item.action) {
    action.querySelector(".ui-button__label")!.textContent = item.action.label;
    action.addEventListener("click", () => {
      item.action?.onClick();
      dismiss(item.id);
    });
  } else action?.remove();
  li.querySelector(".ui-toast__close")?.addEventListener("click", () => dismiss(item.id));
  li.addEventListener("keydown", (event) => {
    if (event.key === "Escape") dismiss(item.id);
  });
  const timer = createToastTimer(item.duration, () => dismiss(item.id));
  const resume = () => {
    if (!li.matches(":hover, :focus-within")) timer.resume();
  };
  li.addEventListener("mouseenter", timer.pause);
  li.addEventListener("focusin", timer.pause);
  li.addEventListener("mouseleave", resume);
  li.addEventListener("focusout", () => requestAnimationFrame(resume));
  li.addEventListener("ui:toast-remove", timer.clear);
  return li;
}

export function bindToasters(): void {
  unsubscribe?.();
  const root = document.querySelector<HTMLElement>("[data-ui-toaster]");
  const list = root?.querySelector<HTMLElement>(".ui-toaster__list");
  if (!root || !list) {
    unsubscribe = null;
    return;
  }
  unsubscribe = subscribe((event) => {
    if (event.type === "add") {
      const li = render(root, event.toast);
      if (li) list.appendChild(li);
      return;
    }
    const li = list.querySelector<HTMLElement>(`[data-id="${event.id}"]`);
    li?.dispatchEvent(new Event("ui:toast-remove"));
    li?.remove();
  });
}

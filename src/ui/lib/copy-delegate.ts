import { copyTextToClipboard } from "./clipboard";

const DEFAULT_RESET = 1600;
const timers = new WeakMap<HTMLElement, number>();

function resolveValue(button: HTMLElement): string | null {
  if (button.hasAttribute("data-ui-copy")) return button.dataset.value ?? "";
  const attr = button.getAttribute("data-copy");
  if (attr) return attr;
  const pre = button.closest(".ui-code-block")?.querySelector("pre");
  return pre?.textContent ?? null;
}

function setState(button: HTMLElement, copied: boolean): void {
  button.dataset.state = copied ? "copied" : "idle";
  const label = copied ? button.dataset.copiedLabel : button.dataset.label;
  const labelEl = button.querySelector<HTMLElement>(".ui-copy-button__label");
  if (label && labelEl) labelEl.textContent = label;
  if (label && button.dataset.appearance === "icon") button.setAttribute("aria-label", label);
  const live = button.querySelector<HTMLElement>(".ui-copy-button__live");
  if (live) live.textContent = copied ? (button.dataset.copiedLabel ?? "Copied") : "";
}

async function handleClick(event: MouseEvent): Promise<void> {
  const target = event.target as Element | null;
  const button = target?.closest<HTMLElement>("[data-ui-copy], .ui-code-block [data-copy]");
  if (!button || button.matches(":disabled, [aria-disabled='true']")) return;
  const value = resolveValue(button);
  if (value === null) return;
  try {
    await copyTextToClipboard(value);
  } catch (error) {
    console.error("[ui:copy] clipboard write failed", error);
    return;
  }
  setState(button, true);
  window.clearTimeout(timers.get(button));
  const reset = Number(button.dataset.resetAfter) || DEFAULT_RESET;
  timers.set(button, window.setTimeout(() => setState(button, false), reset));
  button.dispatchEvent(new CustomEvent("ui:copied", { bubbles: true, detail: { value } }));
}

/**
 * Document-level copy handler for Astro CopyButton (`[data-ui-copy]`) and generated
 * `.ui-code-block [data-copy]` HTML. Delegated so it survives ClientRouter swaps; idempotent.
 */
export function bindCopyDelegate(): void {
  const root = document.documentElement;
  if (root.dataset.uiCopyBound === "1") return;
  root.dataset.uiCopyBound = "1";
  document.addEventListener("click", (event) => void handleClick(event));
}

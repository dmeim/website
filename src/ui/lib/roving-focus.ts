const ITEM_SELECTOR = "button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex]";

function items(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter(
    (el) => el.closest("[role='toolbar']") === root && !el.closest("[role='tooltip']"),
  );
}

/** Ensure exactly one toolbar item is tabbable (the active one, else the current or first). */
export function syncRovingTabindex(root: HTMLElement, active?: HTMLElement | null): void {
  const list = items(root);
  if (list.length === 0) return;
  const current = active && list.includes(active) ? active : (list.find((el) => el.tabIndex === 0) ?? list[0]);
  for (const el of list) el.tabIndex = el === current ? 0 : -1;
}

/** Arrow/Home/End navigation for a role="toolbar" element. Returns true when handled. */
export function handleRovingKey(root: HTMLElement, event: KeyboardEvent): boolean {
  const vertical = root.getAttribute("aria-orientation") === "vertical";
  const next = vertical ? "ArrowDown" : "ArrowRight";
  const prev = vertical ? "ArrowUp" : "ArrowLeft";
  if (![next, prev, "Home", "End"].includes(event.key)) return false;
  const list = items(root);
  if (list.length === 0) return false;
  const index = list.indexOf(document.activeElement as HTMLElement);
  let target = 0;
  if (event.key === "End") target = list.length - 1;
  else if (event.key === next) target = index < 0 ? 0 : (index + 1) % list.length;
  else if (event.key === prev) target = index <= 0 ? list.length - 1 : index - 1;
  event.preventDefault();
  syncRovingTabindex(root, list[target]);
  list[target].focus();
  return true;
}

/** Idempotent binder for Astro toolbars (`[data-ui-toolbar]`). */
export function bindToolbars(): void {
  for (const root of document.querySelectorAll<HTMLElement>("[data-ui-toolbar]")) {
    if (root.dataset.bound === "1") continue;
    root.dataset.bound = "1";
    syncRovingTabindex(root);
    root.addEventListener("keydown", (event) => handleRovingKey(root, event));
    root.addEventListener("focusin", (event) => syncRovingTabindex(root, event.target as HTMLElement));
  }
}

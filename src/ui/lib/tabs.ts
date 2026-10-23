/** Tabs helpers shared by the Astro binder and the React component. */

export function enabledTabs(list: HTMLElement): HTMLButtonElement[] {
  return Array.from(list.querySelectorAll<HTMLButtonElement>("[role='tab']")).filter((tab) => !tab.disabled);
}

/** Target tab for an arrow/Home/End key, or null when the key is not a tab key. */
export function tabForKey(list: HTMLElement, key: string): HTMLButtonElement | null {
  const tabs = enabledTabs(list);
  if (tabs.length === 0) return null;
  const index = tabs.indexOf(document.activeElement as HTMLButtonElement);
  const rtl = getComputedStyle(list).direction === "rtl";
  const next = rtl ? "ArrowLeft" : "ArrowRight";
  const prev = rtl ? "ArrowRight" : "ArrowLeft";
  if (key === "Home") return tabs[0];
  if (key === "End") return tabs[tabs.length - 1];
  if (key === next) return tabs[(index + 1) % tabs.length];
  if (key === prev) return tabs[index <= 0 ? tabs.length - 1 : index - 1];
  return null;
}

/** Moves the indicator under the selected tab; the first measure appears in place. */
export function placeIndicator(list: HTMLElement): void {
  const tab = list.querySelector<HTMLElement>("[role='tab'][aria-selected='true']");
  if (!tab) {
    delete list.dataset.indicator;
    return;
  }
  list.style.setProperty("--ui-tab-x", `${tab.offsetLeft}px`);
  list.style.setProperty("--ui-tab-w", `${tab.offsetWidth}px`);
  if (!list.dataset.indicator) {
    list.dataset.indicator = "placed";
    requestAnimationFrame(() => {
      if (list.dataset.indicator) list.dataset.indicator = "ready";
    });
  }
}

function select(root: HTMLElement, tab: HTMLButtonElement): void {
  const list = root.querySelector<HTMLElement>(":scope > .ui-tabs__list");
  if (!list) return;
  for (const other of list.querySelectorAll<HTMLButtonElement>("[role='tab']")) {
    const on = other === tab;
    other.setAttribute("aria-selected", String(on));
    other.tabIndex = on ? 0 : -1;
    const panel = document.getElementById(other.getAttribute("aria-controls") ?? "");
    if (panel) panel.hidden = !on;
  }
  placeIndicator(list);
  root.dispatchEvent(new CustomEvent("ui:tabs-change", { detail: { id: tab.dataset.value } }));
}

/** Idempotent binder for Astro tabs (`[data-ui-tabs]`). */
export function bindTabs(): void {
  for (const root of document.querySelectorAll<HTMLElement>("[data-ui-tabs]")) {
    if (root.dataset.bound === "1") continue;
    root.dataset.bound = "1";
    const list = root.querySelector<HTMLElement>(":scope > .ui-tabs__list");
    if (!list) continue;
    const manual = root.dataset.activation === "manual";
    placeIndicator(list);
    new ResizeObserver(() => placeIndicator(list)).observe(list);
    list.addEventListener("click", (event) => {
      const tab = (event.target as HTMLElement).closest<HTMLButtonElement>("[role='tab']");
      if (tab && !tab.disabled) select(root, tab);
    });
    list.addEventListener("keydown", (event) => {
      const target = tabForKey(list, event.key);
      if (!target) return;
      event.preventDefault();
      target.focus();
      if (!manual) select(root, target);
    });
  }
}

/** Behaviour for the appendix controls: switch, tabs, tooltip dismissal. */

function bindSwitches(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-lt-switch]").forEach((el) => {
    el.addEventListener("click", () => {
      el.setAttribute("aria-checked", String(el.getAttribute("aria-checked") !== "true"));
    });
  });
}

function selectTab(tabs: HTMLButtonElement[], next: HTMLButtonElement): void {
  tabs.forEach((tab) => {
    const selected = tab === next;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(tab.getAttribute("aria-controls") ?? "");
    if (panel) panel.hidden = !selected;
  });
}

// Roving tabindex per the WAI-ARIA tabs pattern: arrows move, Home/End jump.
function bindTabs(): void {
  document.querySelectorAll<HTMLElement>("[data-lt-tabs]").forEach((root) => {
    const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => selectTab(tabs, tab));
      tab.addEventListener("keydown", (event) => {
        const last = tabs.length - 1;
        const target =
          event.key === "ArrowRight" ? tabs[index === last ? 0 : index + 1]
          : event.key === "ArrowLeft" ? tabs[index === 0 ? last : index - 1]
          : event.key === "Home" ? tabs[0]
          : event.key === "End" ? tabs[last]
          : undefined;
        if (!target) return;
        event.preventDefault();
        selectTab(tabs, target);
        target.focus();
      });
    });
  });
}

// Escape hides a visible tooltip without moving focus (WCAG 1.4.13).
function bindTooltips(): void {
  document.querySelectorAll<HTMLElement>(".lt-tip").forEach((tip) => {
    tip.addEventListener("keydown", (event) => {
      if (event.key === "Escape") tip.setAttribute("data-dismissed", "");
    });
    const reset = () => tip.removeAttribute("data-dismissed");
    tip.addEventListener("focusout", reset);
    tip.addEventListener("mouseleave", reset);
  });
}

export function initLetterSystem(): void {
  bindSwitches();
  bindTabs();
  bindTooltips();
}

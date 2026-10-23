/** WAI-ARIA tabs with automatic activation and a sliding underline. */

function bindTabs(root: HTMLElement): void {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>("[role='tab']"));
  const indicator = root.querySelector<HTMLElement>("[data-mg-tabs-indicator]");
  if (!tabs.length) return;

  const place = (tab: HTMLElement): void => {
    if (!indicator) return;
    indicator.style.setProperty("--x", `${tab.offsetLeft}px`);
    indicator.style.setProperty("--w", `${tab.offsetWidth}px`);
  };

  const select = (next: HTMLButtonElement, focus: boolean): void => {
    tabs.forEach((tab) => {
      const active = tab === next;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute("aria-controls") ?? "");
      if (panel) panel.hidden = !active;
    });
    place(next);
    if (focus) next.focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(tab, false));
    tab.addEventListener("keydown", (event) => {
      const last = tabs.length - 1;
      const target =
        event.key === "ArrowRight"
          ? tabs[index === last ? 0 : index + 1]
          : event.key === "ArrowLeft"
            ? tabs[index === 0 ? last : index - 1]
            : event.key === "Home"
              ? tabs[0]
              : event.key === "End"
                ? tabs[last]
                : null;
      if (!target) return;
      event.preventDefault();
      select(target, true);
    });
  });

  const initial = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") ?? tabs[0];
  place(initial);
  window.addEventListener("resize", () => {
    const active = tabs.find((tab) => tab.getAttribute("aria-selected") === "true");
    if (active) place(active);
  });
  document.fonts?.ready.then(() => place(initial));
}

export function initTabs(): void {
  document.querySelectorAll<HTMLElement>("[data-mg-tabs]").forEach(bindTabs);
}

/** WAI-ARIA tabs with automatic activation and roving tabindex. */
export function initTabs(): void {
  document.querySelectorAll<HTMLElement>("[data-p-tabs]").forEach((root) => {
    const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));

    const select = (next: HTMLButtonElement): void => {
      tabs.forEach((tab) => {
        const on = tab === next;
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(tab.getAttribute("aria-controls") ?? "");
        if (panel) panel.hidden = !on;
      });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (event) => {
        const step: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
        let target: HTMLButtonElement | undefined;
        if (event.key in step) target = tabs[(index + step[event.key] + tabs.length) % tabs.length];
        if (event.key === "Home") target = tabs[0];
        if (event.key === "End") target = tabs[tabs.length - 1];
        if (!target) return;
        event.preventDefault();
        target.focus();
        select(target);
      });
    });
  });
}

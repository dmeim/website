/** One document-level Escape handler: dismisses hovered/focused tooltips until pointer or focus leaves. */
export function bindTooltipEscape(): void {
  const root = document.documentElement;
  if (root.dataset.uiTooltipBound === "1") return;
  root.dataset.uiTooltipBound = "1";
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    for (const tip of document.querySelectorAll<HTMLElement>(".ui-tooltip:hover, .ui-tooltip:focus-within")) {
      tip.dataset.dismissed = "";
    }
  });
}

/** Idempotent binder for Astro tooltips (`[data-ui-tooltip]`): links aria-describedby to the trigger. */
export function bindTooltips(): void {
  bindTooltipEscape();
  for (const root of document.querySelectorAll<HTMLElement>("[data-ui-tooltip]")) {
    if (root.dataset.bound === "1") continue;
    root.dataset.bound = "1";
    const bubble = root.querySelector<HTMLElement>(":scope > .ui-tooltip__bubble");
    const trigger = Array.from(root.children).find((el) => el !== bubble) as HTMLElement | undefined;
    const focusable = trigger?.matches("a, button, input, select, textarea, [tabindex]")
      ? trigger
      : trigger?.querySelector<HTMLElement>("a, button, input, select, textarea, [tabindex]");
    if (bubble && focusable && focusable.getAttribute("aria-label") !== bubble.textContent) {
      const ids = new Set((focusable.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean));
      ids.add(bubble.id);
      focusable.setAttribute("aria-describedby", [...ids].join(" "));
    }
    const reset = () => delete root.dataset.dismissed;
    root.addEventListener("mouseleave", reset);
    root.addEventListener("focusout", reset);
  }
}

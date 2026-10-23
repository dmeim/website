/**
 * FLIP filtering for the Selected work grid: outgoing cards fade, survivors
 * glide to their new slots, newcomers rise in.
 */
import { prefersReducedMotion } from "../../shared/concept-runtime";
import { announce } from "./interactions";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function matches(card: HTMLElement, filter: string): boolean {
  return filter === "all" || card.dataset.status === filter;
}

export function initWorkFilter(root: HTMLElement): void {
  const seg = root.querySelector<HTMLElement>("[data-work-filter]");
  const grid = root.querySelector<HTMLElement>("[data-work-grid]");
  if (!seg || !grid) return;

  const cards = [...grid.querySelectorAll<HTMLElement>("[data-status]")];
  let run = 0;

  seg.addEventListener("seg:change", async (event) => {
    const filter = (event as CustomEvent<string>).detail ?? "all";
    const token = ++run;
    const visible = cards.filter((card) => !card.hidden);
    const leaving = visible.filter((card) => !matches(card, filter));
    const staying = visible.filter((card) => matches(card, filter));
    const entering = cards.filter((card) => card.hidden && matches(card, filter));
    const count = staying.length + entering.length;
    announce(`Showing ${count} project${count === 1 ? "" : "s"}`);

    if (prefersReducedMotion()) {
      leaving.forEach((card) => (card.hidden = true));
      entering.forEach((card) => (card.hidden = false));
      return;
    }

    cards.forEach((card) => card.getAnimations().forEach((a) => a.cancel()));
    const first = new Map(staying.map((card) => [card, card.getBoundingClientRect()]));

    const exits = Promise.all(
      leaving.map(
        (card) =>
          card.animate(
            [
              { opacity: 1, transform: "scale(1)" },
              { opacity: 0, transform: "scale(0.96)" },
            ],
            { duration: 160, easing: EASE, fill: "forwards" },
          ).finished.catch(() => undefined),
      ),
    );
    // Background tabs can stall animation timelines; never let that block the filter.
    await Promise.race([exits, new Promise((resolve) => window.setTimeout(resolve, 220))]);
    if (token !== run) return;

    leaving.forEach((card) => {
      card.hidden = true;
      card.getAnimations().forEach((a) => a.cancel());
    });
    entering.forEach((card) => {
      card.hidden = false;
      card.setAttribute("data-revealed", "true");
    });

    staying.forEach((card) => {
      const before = first.get(card);
      if (!before) return;
      const after = card.getBoundingClientRect();
      const dx = before.left - after.left;
      const dy = before.top - after.top;
      if (!dx && !dy) return;
      card.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
        { duration: 520, easing: EASE },
      );
    });

    entering.forEach((card, i) => {
      card.animate(
        [
          { opacity: 0, transform: "translateY(12px) scale(0.98)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 420, delay: 60 + i * 50, easing: EASE, fill: "backwards" },
      );
    });
  });
}

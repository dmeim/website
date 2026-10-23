/**
 * Scroll reveals for Astro pages. `[data-reveal]` gets `data-revealed="true"`
 * once in view; children of `[data-reveal-group]` get `--reveal-index`.
 * Idempotent across ClientRouter `astro:page-load`.
 */

let observer: IntersectionObserver | null = null;

function revealAll(targets: Iterable<HTMLElement>): void {
  for (const el of targets) el.setAttribute("data-revealed", "true");
}

function getObserver(): IntersectionObserver {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.setAttribute("data-revealed", "true");
        obs.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
  );
  return observer;
}

export function bindReveals(root: ParentNode = document): void {
  document.documentElement.classList.add("js");

  root.querySelectorAll<HTMLElement>("[data-reveal-group]").forEach((group) => {
    group.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el, index) => {
      el.style.setProperty("--reveal-index", String(index));
    });
  });

  const targets = Array.from(
    root.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed='true'])"),
  ).filter((el) => el.dataset.revealBound !== "1");

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    revealAll(targets);
    return;
  }

  const obs = getObserver();
  targets.forEach((el) => {
    el.dataset.revealBound = "1";
    obs.observe(el);
  });
}

let started = false;

export function initReveals(): void {
  if (started) return;
  started = true;
  bindReveals();
  document.addEventListener("astro:page-load", () => bindReveals());
}

/**
 * The gliding gold current marker. A container marked `[data-ui-nav-marker]`
 * holds one `.ui-nav-marker` and any number of `[data-ui-marker-target]`
 * links. The target is the one with `aria-current="location"` (scroll-spy),
 * else the last visible one with any `aria-current`. Vertical markers sit on the nearest
 * `[data-ui-marker-rail]` hairline; horizontal ones underline the target.
 */

const bound = new WeakMap<HTMLElement, () => void>();

function findTarget(container: HTMLElement): HTMLElement | null {
  const targets = container.querySelectorAll<HTMLElement>("[data-ui-marker-target]");
  let page: HTMLElement | null = null;
  for (const el of targets) {
    const current = el.getAttribute("aria-current");
    if (current === "location") return el;
    // The deepest visible current wins, so a nested current tool beats its parent page link.
    if (current && el.getClientRects().length > 0) page = el;
  }
  return page;
}

export function placeNavMarker(container: HTMLElement): void {
  const marker = container.querySelector<HTMLElement>(":scope > .ui-nav-marker, :scope .ui-nav-marker");
  if (!marker) return;
  const target = findTarget(container);
  const rect = target?.getBoundingClientRect();
  if (!target || !rect || rect.height === 0 || rect.width === 0) {
    marker.dataset.visible = "false";
    return;
  }
  const box = container.getBoundingClientRect();
  const vertical = marker.dataset.axis !== "x";
  if (vertical) {
    const rail = target.closest<HTMLElement>("[data-ui-marker-rail]");
    const left = rail ? rail.getBoundingClientRect().left : rect.left;
    marker.style.setProperty("--ui-spy-x", `${left - box.left}px`);
    marker.style.setProperty("--ui-spy-y", `${rect.top - box.top}px`);
    marker.style.setProperty("--ui-spy-h", `${rect.height}px`);
  } else {
    marker.style.setProperty("--ui-spy-x", `${rect.left - box.left}px`);
    marker.style.setProperty("--ui-spy-w", `${rect.width}px`);
  }
  // Appearing from hidden fades in place instead of gliding from the origin.
  if (marker.dataset.visible !== "true") {
    marker.dataset.instant = "true";
    marker.dataset.visible = "true";
    requestAnimationFrame(() => requestAnimationFrame(() => delete marker.dataset.instant));
  }
}

/** Bind one marker container; returns a cleanup. Idempotent per element. */
export function bindNavMarker(container: HTMLElement): () => void {
  const existing = bound.get(container);
  if (existing) return existing;
  const place = () => placeNavMarker(container);
  const resize = new ResizeObserver(place);
  resize.observe(container);
  container.querySelectorAll("[data-ui-marker-rail]").forEach((el) => resize.observe(el));
  const mutations = new MutationObserver(place);
  mutations.observe(container, { subtree: true, childList: true, attributes: true, attributeFilter: ["aria-current", "open", "hidden"] });
  document.fonts?.ready.then(place).catch(() => {});
  place();
  const cleanup = () => {
    resize.disconnect();
    mutations.disconnect();
    bound.delete(container);
  };
  bound.set(container, cleanup);
  return cleanup;
}

let pageCleanups: Array<() => void> = [];
let swapBound = false;

/** Bind every Astro-rendered marker; observers are released on ClientRouter swaps. */
export function bindNavMarkers(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-ui-nav-marker]").forEach((el) => {
    // React islands bind their own markers; touching their DOM pre-hydration causes a mismatch.
    if (el.dataset.bound === "1" || el.closest("astro-island")) return;
    el.dataset.bound = "1";
    pageCleanups.push(bindNavMarker(el));
  });
  if (swapBound) return;
  swapBound = true;
  document.addEventListener("astro:before-swap", () => {
    pageCleanups.forEach((fn) => fn());
    pageCleanups = [];
  });
}

/**
 * Scroll-spy: a thin observation band ~30% down the viewport. The active
 * section is the last one whose top has crossed the band; above the first
 * section nothing is active. At the bottom of the page the last section is
 * active, since a short final section can never reach the band. Links get `aria-current="location"`, which the
 * nav marker follows.
 */

const BAND = "-30% 0px -69% 0px";
const BAND_RATIO = 0.3;

export interface SpyTarget {
  section: HTMLElement;
  link: HTMLElement;
}

export function createSpy(targets: SpyTarget[]): () => void {
  if (!targets.length || !("IntersectionObserver" in window)) return () => {};
  let active: HTMLElement | null = null;

  const update = (): void => {
    const line = window.innerHeight * BAND_RATIO;
    let next: HTMLElement | null = null;
    for (const { section, link } of targets) {
      if (section.getBoundingClientRect().top <= line) next = link;
    }
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom && next) next = targets[targets.length - 1].link;
    if (next === active) return;
    active?.removeAttribute("aria-current");
    next?.setAttribute("aria-current", "location");
    active = next;
  };

  const observer = new IntersectionObserver(update, { rootMargin: BAND, threshold: 0 });
  targets.forEach(({ section }) => observer.observe(section));
  // Reaching the bottom crosses no band, so watch scroll too (one update per frame).
  let frame = 0;
  const onScroll = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  update();
  return () => {
    observer.disconnect();
    window.removeEventListener("scroll", onScroll);
    cancelAnimationFrame(frame);
  };
}

let cleanups: Array<() => void> = [];
let swapBound = false;

/** Track spies so ClientRouter swaps disconnect observers on old pages. */
export function registerSpy(cleanup: () => void): void {
  cleanups.push(cleanup);
  if (swapBound) return;
  swapBound = true;
  document.addEventListener("astro:before-swap", () => {
    cleanups.forEach((fn) => fn());
    cleanups = [];
  });
}

/** In-page anchor spy for `[data-ui-side-nav][data-spy]`. */
export function bindSideNavSpies(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-ui-side-nav][data-spy='true']").forEach((nav) => {
    if (nav.dataset.spyBound === "1") return;
    nav.dataset.spyBound = "1";
    const targets: SpyTarget[] = [];
    nav.querySelectorAll<HTMLAnchorElement>("a[data-ui-marker-target][href^='#']").forEach((link) => {
      const section = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (section) targets.push({ section, link });
    });
    registerSpy(createSpy(targets));
  });
}

/**
 * Rail SiteNav: expand the current item with the page's spy sections
 * (`main [data-ui-spy-section]`) and spy them.
 */
export function bindSiteNavSpies(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(".ui-site-nav[data-ui-site-spy]").forEach((nav) => {
    if (nav.dataset.spyBound === "1") return;
    nav.dataset.spyBound = "1";
    const current = nav.querySelector<HTMLElement>(".ui-site-nav__link[aria-current='page']");
    const item = current?.closest("li");
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("main [data-ui-spy-section][id]"),
    );
    if (!item || !sections.length) return;
    const sub = document.createElement("ul");
    sub.className = "ui-site-nav__sub";
    const targets: SpyTarget[] = sections.map((section) => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.className = "ui-site-nav__sublink";
      link.href = `#${section.id}`;
      link.textContent = section.dataset.uiSpyLabel || section.id;
      link.setAttribute("data-ui-marker-target", "");
      li.appendChild(link);
      sub.appendChild(li);
      return { section, link };
    });
    // Sections first, then any child pages the nav already lists.
    item.insertBefore(sub, item.querySelector(":scope > [data-ui-nav-children]"));
    registerSpy(createSpy(targets));
  });
}

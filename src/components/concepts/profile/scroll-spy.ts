/**
 * Scroll-spy for the identity nav. A thin observation band sits ~30% down
 * the viewport; whichever section crosses it lights its nav entry, and the
 * gold marker glides to that link. Sections opt in via `data-spy-section`.
 */

const BAND = "-30% 0px -69% 0px";

export function initScrollSpy(): void {
  const nav = document.querySelector<HTMLElement>("[data-spy-nav]");
  const marker = nav?.querySelector<HTMLElement>("[data-spy-marker]");
  const list = nav?.querySelector<HTMLElement>("[data-spy-list]");
  if (!nav || !marker || !list) return;

  const links = new Map<string, HTMLAnchorElement>();
  nav.querySelectorAll<HTMLAnchorElement>("a[data-spy-link]").forEach((link) => {
    links.set(link.dataset.spyLink ?? "", link);
  });

  let activeKey = "";

  const placeMarker = (): void => {
    const link = links.get(activeKey);
    if (!link) {
      marker.dataset.visible = "false";
      return;
    }
    // Appearing from hidden should fade in place, not glide from the top.
    const wasHidden = marker.dataset.visible !== "true";
    if (wasHidden) marker.dataset.instant = "true";
    marker.style.setProperty("--spy-y", `${link.offsetTop}px`);
    marker.style.setProperty("--spy-h", `${link.offsetHeight}px`);
    marker.dataset.visible = "true";
    if (wasHidden) {
      requestAnimationFrame(() => requestAnimationFrame(() => delete marker.dataset.instant));
    }
  };

  const activate = (key: string): void => {
    if (key === activeKey) return;
    activeKey = key;
    links.forEach((link, linkKey) => {
      if (linkKey === key) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    placeMarker();
  };

  const sections = document.querySelectorAll<HTMLElement>("[data-spy-section]");
  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        activate((entry.target as HTMLElement).dataset.spySection ?? "");
      });
    },
    { rootMargin: BAND, threshold: 0 },
  );
  sections.forEach((section) => observer.observe(section));

  // Webfont swap and breakpoint changes shift link offsets.
  new ResizeObserver(placeMarker).observe(list);
}

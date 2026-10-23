import { clamp, motionAllowed, onScrollFrame, requestScrollFrame } from "./monograph-scroll";

const PIN_QUERY = "(min-width: 960px) and (min-height: 600px)";

export function initWorkGallery(): void {
  const section = document.querySelector<HTMLElement>("[data-mg-work]");
  const track = section?.querySelector<HTMLElement>("[data-mg-work-track]");
  const progressBar = section?.querySelector<HTMLElement>("[data-mg-work-progress]");
  const current = section?.querySelector<HTMLElement>("[data-mg-work-current]");
  if (!section || !track || !progressBar || !current) return;

  const panels = Array.from(track.children) as HTMLElement[];
  const media = window.matchMedia(PIN_QUERY);
  let distance = 0;
  let pinned = false;

  const measure = (): void => {
    pinned = media.matches && motionAllowed();
    section.toggleAttribute("data-pinned", pinned);
    if (!pinned) {
      section.style.height = "";
      track.style.transform = "";
      return;
    }
    distance = Math.max(0, track.scrollWidth - window.innerWidth);
    section.style.height = `${distance + window.innerHeight}px`;
    requestScrollFrame();
  };

  onScrollFrame(() => {
    if (!pinned) return;
    const progress = clamp(-section.getBoundingClientRect().top / Math.max(distance, 1));
    track.style.transform = `translate3d(${(-progress * distance).toFixed(1)}px, 0, 0)`;
    progressBar.style.transform = `scaleX(${progress.toFixed(4)})`;
    const index = Math.min(panels.length - 1, Math.round(progress * (panels.length - 1)));
    const label = String(Math.max(1, index)).padStart(2, "0");
    if (current.textContent !== label) current.textContent = label;
  });

  // Pinned panels are translated off-screen, so keyboard focus scrolls the page to them.
  track.addEventListener("focusin", (event) => {
    if (!pinned) return;
    const panel = (event.target as HTMLElement).closest<HTMLElement>(".mg-work__track > *");
    if (!panel) return;
    // The browser's own (smooth) scroll-into-view starts after focusin; an instant
    // scroll two frames later cancels it and lands on the panel instead.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const sectionTop = section.getBoundingClientRect().top + window.scrollY;
        const offset = clamp(panel.offsetLeft - window.innerWidth * 0.1, 0, distance);
        window.scrollTo({ top: sectionTop + offset, behavior: "instant" });
      }),
    );
  });

  measure();
  window.addEventListener("resize", measure, { passive: true });
  media.addEventListener("change", measure);
  document.fonts?.ready.then(measure);
}

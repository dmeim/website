import { clamp, motionAllowed, onScrollFrame } from "./monograph-scroll";

const FONT_WAIT_MS = 800;

function whenFontsReady(): Promise<unknown> {
  const timeout = new Promise((resolve) => window.setTimeout(resolve, FONT_WAIT_MS));
  if (!("fonts" in document)) return timeout;
  return Promise.race([document.fonts.ready, timeout]);
}

export function initHero(): void {
  const hero = document.querySelector<HTMLElement>("[data-mg-hero]");
  if (!hero) return;

  whenFontsReady().then(() => {
    requestAnimationFrame(() => hero.setAttribute("data-loaded", ""));
  });

  if (!motionAllowed()) return;

  let last = -1;
  onScrollFrame(() => {
    const progress = clamp(window.scrollY / Math.max(hero.offsetHeight, 1));
    if (Math.abs(progress - last) < 0.001) return;
    last = progress;
    hero.style.setProperty("--p", progress.toFixed(4));
  });
}

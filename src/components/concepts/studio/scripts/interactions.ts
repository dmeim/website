/**
 * Small, page-wide behaviours for the Studio concept. Each init is idempotent
 * per element so components can call them without coordinating.
 */
import { prefersReducedMotion } from "../../shared/concept-runtime";

const SELECTED = '[aria-pressed="true"], [aria-checked="true"], [aria-selected="true"]';

export function finePointer(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/** Cursor-follow spotlight: writes pointer position into --mx/--my. */
export function initSpotlight(): void {
  if (document.documentElement.dataset.spotlightBound) return;
  document.documentElement.dataset.spotlightBound = "true";
  if (!finePointer()) return;

  let frame = 0;
  let last: { el: HTMLElement; x: number; y: number } | null = null;

  document.addEventListener(
    "pointermove",
    (event) => {
      const el = (event.target as Element | null)?.closest<HTMLElement>("[data-spotlight]");
      if (!el) return;
      last = { el, x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!last) return;
        const rect = last.el.getBoundingClientRect();
        last.el.style.setProperty("--mx", `${last.x - rect.left}px`);
        last.el.style.setProperty("--my", `${last.y - rect.top}px`);
      });
    },
    { passive: true },
  );
}

export function positionThumb(seg: HTMLElement): void {
  const active = seg.querySelector<HTMLElement>(`.seg__option:is(${SELECTED})`);
  if (!active) {
    seg.style.setProperty("--thumb-w", "0px");
    return;
  }
  seg.style.setProperty("--thumb-x", `${active.offsetLeft}px`);
  seg.style.setProperty("--thumb-w", `${active.offsetWidth}px`);
}

function bindSelectable(seg: HTMLElement): void {
  const options = () => [...seg.querySelectorAll<HTMLElement>(".seg__option")];

  const select = (target: HTMLElement) => {
    options().forEach((option) => {
      option.setAttribute("aria-pressed", String(option === target));
    });
    seg.dispatchEvent(
      new CustomEvent("seg:change", { detail: target.dataset.value, bubbles: true }),
    );
  };

  seg.addEventListener("click", (event) => {
    const option = (event.target as Element).closest<HTMLElement>(".seg__option");
    if (option && seg.contains(option)) select(option);
  });

  seg.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const list = options();
    const index = list.indexOf(document.activeElement as HTMLElement);
    if (index < 0) return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = list[(index + step + list.length) % list.length];
    next.focus();
    select(next);
  });
}

/**
 * Segmented controls: `[data-seg]` with `.seg__option` children and a
 * `.seg__thumb`. `data-seg="select"` also manages aria-pressed itself;
 * other values only follow state set elsewhere (e.g. the theme runtime).
 */
export function initSegmented(): void {
  document.querySelectorAll<HTMLElement>("[data-seg]").forEach((seg) => {
    if (seg.dataset.segBound) return;
    seg.dataset.segBound = "true";
    if (seg.dataset.seg === "select") bindSelectable(seg);

    positionThumb(seg);
    requestAnimationFrame(() => seg.setAttribute("data-ready", ""));

    new MutationObserver(() => positionThumb(seg)).observe(seg, {
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-pressed", "aria-checked", "aria-selected"],
    });
    new ResizeObserver(() => positionThumb(seg)).observe(seg);
  });
}

/** Counts `[data-count-to]` up from zero the first time it scrolls into view. */
export function initCountUp(): void {
  const els = [...document.querySelectorAll<HTMLElement>("[data-count-to]")];
  if (!els.length || prefersReducedMotion() || !("IntersectionObserver" in window)) return;

  const run = (el: HTMLElement) => {
    const target = Number(el.dataset.countTo ?? 0);
    const duration = 1400;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        window.setTimeout(() => run(entry.target as HTMLElement), 250);
      });
    },
    { threshold: 0.4 },
  );

  els.forEach((el) => {
    el.textContent = "0";
    observer.observe(el);
  });
}

export function announce(message: string): void {
  const region = document.getElementById("studio-live");
  if (!region) return;
  region.textContent = "";
  window.setTimeout(() => (region.textContent = message), 30);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

/** `[data-copy]` buttons: copies the value and flips `data-copied` briefly. */
export function initCopyButtons(): void {
  if (document.documentElement.dataset.copyBound) return;
  document.documentElement.dataset.copyBound = "true";
  const timers = new WeakMap<HTMLElement, number>();

  document.addEventListener("click", async (event) => {
    const button = (event.target as Element | null)?.closest<HTMLElement>("[data-copy]");
    if (!button) return;
    const ok = await copyText(button.dataset.copy ?? "");
    if (!ok) {
      announce("Copy failed — select the text and copy it manually.");
      return;
    }
    button.dataset.copied = "true";
    announce(button.dataset.copyLabel ?? "Copied to clipboard");
    window.clearTimeout(timers.get(button));
    timers.set(
      button,
      window.setTimeout(() => delete button.dataset.copied, 1800),
    );
  });
}

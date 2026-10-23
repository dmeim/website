import { onScrollFrame, requestScrollFrame } from "./monograph-scroll";

const HIDE_AFTER = 0.9;

function bindMenu(header: HTMLElement): () => boolean {
  const toggle = header.querySelector<HTMLButtonElement>("[data-mg-menu-toggle]");
  const menu = header.querySelector<HTMLElement>("[data-mg-menu]");
  if (!toggle || !menu) return () => false;

  let open = false;

  const set = (next: boolean): void => {
    open = next;
    toggle.setAttribute("aria-expanded", String(next));
    document.documentElement.toggleAttribute("data-mg-menu-open", next);
    document.body.style.overflow = next ? "hidden" : "";
    document.querySelectorAll<HTMLElement>("main, footer, .mg-skip").forEach((el) => {
      el.inert = next;
    });
    requestScrollFrame();
    if (next) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.setAttribute("data-open", ""));
      menu.querySelector<HTMLAnchorElement>("a")?.focus({ preventScroll: true });
      return;
    }
    menu.removeAttribute("data-open");
    window.setTimeout(() => {
      if (!open) menu.hidden = true;
    }, 600);
  };

  toggle.addEventListener("click", () => set(!open));
  menu.addEventListener("click", (event) => {
    if ((event.target as HTMLElement).closest("a")) set(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !open) return;
    set(false);
    toggle.focus();
  });
  window.matchMedia("(min-width: 861px)").addEventListener("change", (event) => {
    if (event.matches && open) set(false);
  });

  return () => open;
}

export function initHeader(): void {
  const header = document.querySelector<HTMLElement>("[data-mg-header]");
  if (!header) return;

  const isMenuOpen = bindMenu(header);
  const hero = document.querySelector<HTMLElement>("[data-mg-hero]");
  const bands = Array.from(document.querySelectorAll<HTMLElement>("[data-band='invert']"));
  let lastY = window.scrollY;

  onScrollFrame(() => {
    const y = window.scrollY;
    const probe = header.offsetHeight / 2;
    const overBand = bands.some((band) => {
      const rect = band.getBoundingClientRect();
      return rect.top <= probe && rect.bottom >= probe;
    });
    const pastHero = y > (hero?.offsetHeight ?? window.innerHeight) * HIDE_AFTER;
    const goingDown = y > lastY + 2;
    const goingUp = y < lastY - 2;

    header.classList.toggle("mg-tokens-invert", overBand || isMenuOpen());
    header.toggleAttribute("data-scrolled", y > 24);
    if (goingDown && pastHero && !isMenuOpen()) header.setAttribute("data-hidden", "");
    if (goingUp || !pastHero) header.removeAttribute("data-hidden");
    lastY = y;
  });

  header.addEventListener("focusin", () => header.removeAttribute("data-hidden"));
}

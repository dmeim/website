/**
 * Header behaviour: translucent-on-scroll, sliding nav indicator, platform
 * shortcut label and the mobile menu disclosure.
 */
import { finePointer } from "./interactions";

export function initHeader(): void {
  const header = document.querySelector<HTMLElement>("[data-header]");
  const nav = document.querySelector<HTMLElement>("[data-nav]");
  const indicator = document.querySelector<HTMLElement>("[data-nav-indicator]");
  const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const panel = document.querySelector<HTMLElement>("[data-mobile-nav]");

  if (header) {
    const onScroll = () => header.toggleAttribute("data-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  if (!/Mac|iPhone|iPad/.test(navigator.platform)) {
    document.querySelectorAll("[data-mod-key]").forEach((el) => (el.textContent = "Ctrl"));
  }

  // Indicator jumps into place on first hover, then glides between links.
  if (nav && indicator) {
    const moveTo = (link: HTMLElement) => {
      const visible = indicator.dataset.visible === "true";
      if (!visible) indicator.style.transition = "none";
      indicator.style.setProperty("--x", `${link.offsetLeft}px`);
      indicator.style.setProperty("--w", `${link.offsetWidth}px`);
      if (!visible) {
        void indicator.offsetWidth;
        indicator.style.transition = "";
      }
      indicator.dataset.visible = "true";
    };
    const hide = () => (indicator.dataset.visible = "false");

    nav.querySelectorAll<HTMLElement>(".nav__link").forEach((link) => {
      if (finePointer()) link.addEventListener("pointerenter", () => moveTo(link));
      link.addEventListener("focus", () => moveTo(link));
      link.addEventListener("blur", hide);
    });
    nav.addEventListener("pointerleave", hide);
  }

  if (toggle && panel) {
    const setOpen = (open: boolean) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Menu");
      if (open) {
        panel.hidden = false;
        requestAnimationFrame(() => panel.setAttribute("data-open", ""));
      } else {
        panel.removeAttribute("data-open");
        window.setTimeout(() => {
          if (toggle.getAttribute("aria-expanded") === "false") panel.hidden = true;
        }, 250);
      }
    };
    toggle.addEventListener("click", () =>
      setOpen(toggle.getAttribute("aria-expanded") !== "true"),
    );
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener("click", (event) => {
      const target = event.target as Node;
      if (!header?.contains(target)) setOpen(false);
    });
    window.matchMedia("(min-width: 860px)").addEventListener("change", () => setOpen(false));
  }
}

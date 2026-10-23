/**
 * ⌘K palette on a native modal <dialog>: the dialog supplies the focus trap
 * and inert background; this adds filtering, the moving highlight and
 * keyboard navigation via aria-activedescendant.
 */
import { prefersReducedMotion } from "../../shared/concept-runtime";
import { copyText } from "./interactions";
import { showToast } from "./toast";

export function initCommandPalette(): void {
  const dialog = document.querySelector<HTMLDialogElement>("[data-palette]");
  const input = dialog?.querySelector<HTMLInputElement>("[data-palette-input]");
  const scroller = dialog?.querySelector<HTMLElement>("[data-palette-scroll]");
  const highlight = dialog?.querySelector<HTMLElement>("[data-palette-highlight]");
  const empty = dialog?.querySelector<HTMLElement>("[data-palette-empty]");
  if (!dialog || !input || !scroller || !highlight || !empty || dialog.dataset.bound) return;
  dialog.dataset.bound = "true";

  const options = [...dialog.querySelectorAll<HTMLElement>('[role="option"]')];
  const groups = [...dialog.querySelectorAll<HTMLElement>('[role="group"]')];
  let visible = options;
  let active = -1;
  let returnFocus: HTMLElement | null = null;

  const moveHighlight = (animate: boolean) => {
    const option = visible[active];
    if (!option) {
      highlight.removeAttribute("data-visible");
      return;
    }
    highlight.toggleAttribute("data-animate", animate && !prefersReducedMotion());
    highlight.style.setProperty("--y", `${option.offsetTop + 8}px`);
    highlight.style.setProperty("--h", `${option.offsetHeight}px`);
    highlight.setAttribute("data-visible", "");
  };

  const setActive = (index: number, animate = true) => {
    options.forEach((o) => o.setAttribute("aria-selected", "false"));
    active = visible.length ? (index + visible.length) % visible.length : -1;
    const option = visible[active];
    if (option) {
      option.setAttribute("aria-selected", "true");
      input.setAttribute("aria-activedescendant", option.id);
      option.scrollIntoView({ block: "nearest" });
    } else {
      input.removeAttribute("aria-activedescendant");
    }
    moveHighlight(animate);
  };

  const filter = () => {
    const terms = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    visible = options.filter((option) => {
      const haystack = option.dataset.search ?? "";
      const match = terms.every((term) => haystack.includes(term));
      option.hidden = !match;
      return match;
    });
    groups.forEach((group) => {
      group.hidden = !group.querySelector('[role="option"]:not([hidden])');
    });
    empty.hidden = visible.length > 0;
    scroller.scrollTop = 0;
    setActive(0, false);
  };

  const open = () => {
    if (dialog.open) return;
    returnFocus = document.activeElement as HTMLElement | null;
    input.value = "";
    filter();
    dialog.removeAttribute("data-closing");
    dialog.showModal();
    input.focus();
    requestAnimationFrame(() => setActive(0, false));
  };

  const close = () => {
    if (!dialog.open || dialog.hasAttribute("data-closing")) return;
    const finish = () => {
      dialog.removeAttribute("data-closing");
      dialog.close();
      returnFocus?.focus();
    };
    if (prefersReducedMotion()) return finish();
    dialog.setAttribute("data-closing", "");
    window.setTimeout(finish, 150);
  };

  const run = async (option: HTMLElement | undefined) => {
    if (!option) return;
    const { href, themeAction, copyAction } = option.dataset;
    if (href) {
      window.location.assign(href);
      return;
    }
    close();
    if (themeAction) {
      document.querySelector<HTMLElement>(`.theme-switch [data-theme-set="${themeAction}"]`)?.click();
    }
    if (copyAction && (await copyText(copyAction))) {
      showToast({ title: "Email copied", body: copyAction });
    }
  };

  input.addEventListener("input", filter);
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive(active + (event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "Home" && event.ctrlKey) {
      setActive(0);
    } else if (event.key === "Enter") {
      event.preventDefault();
      run(visible[active]);
    }
  });

  options.forEach((option) => {
    option.addEventListener("pointermove", () => {
      const index = visible.indexOf(option);
      if (index !== active) setActive(index);
    });
    option.addEventListener("click", () => run(option));
  });

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });

  document.addEventListener("click", (event) => {
    if ((event.target as Element | null)?.closest("[data-palette-open]")) open();
  });
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (dialog.open) close();
      else open();
    }
  });
}

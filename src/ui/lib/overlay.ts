/** Shared overlay helpers: focus trap, scroll lock, and Astro binders for Dialog and Drawer. */

const FOCUSABLE =
  "a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])";

export function focusableIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.closest("[hidden], [inert], [role='tooltip']") && el.getClientRects().length > 0,
  );
}

/** Keeps Tab inside `root`. Returns true when handled. */
export function trapTab(root: HTMLElement, event: KeyboardEvent): boolean {
  if (event.key !== "Tab") return false;
  const list = focusableIn(root);
  if (list.length === 0) {
    event.preventDefault();
    root.focus();
    return true;
  }
  const first = list[0];
  const last = list[list.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !root.contains(active))) {
    event.preventDefault();
    last.focus();
    return true;
  }
  if (!event.shiftKey && (active === last || !root.contains(active))) {
    event.preventDefault();
    first.focus();
    return true;
  }
  return false;
}

let locks = 0;
let saved = "";

// Document-level listeners install once per page lifetime. These live in the
// module, not on <html>: ClientRouter replaces <html> attributes on every
// navigation, so a DOM flag would vanish and a second listener would make one
// click open and immediately close a drawer.
let dialogOpenersBound = false;
let drawerTogglesBound = false;

export function lockScroll(): () => void {
  const root = document.documentElement;
  if (locks === 0) {
    saved = root.style.overflow;
    root.style.overflow = "hidden";
  }
  locks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks -= 1;
    if (locks === 0) root.style.overflow = saved;
  };
}

/* ---------- Astro Dialog ([data-ui-dialog]) ---------- */

const dialogOpeners = new WeakMap<HTMLDialogElement, HTMLElement | null>();

export function openDialog(dialog: HTMLDialogElement, opener?: HTMLElement | null): void {
  if (dialog.open) return;
  dialogOpeners.set(dialog, opener ?? (document.activeElement as HTMLElement | null));
  dialog.showModal();
}

export function closeDialog(dialog: HTMLDialogElement): void {
  if (dialog.open) dialog.close();
}

export function bindDialogs(): void {
  for (const dialog of document.querySelectorAll<HTMLDialogElement>("dialog[data-ui-dialog]")) {
    if (dialog.dataset.bound === "1") continue;
    dialog.dataset.bound = "1";
    const dismissible = dialog.dataset.dismissible !== "false";
    dialog.addEventListener("cancel", (event) => {
      if (!dismissible) event.preventDefault();
    });
    dialog.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      if (target === dialog && dismissible) closeDialog(dialog);
      else if (target.closest("[data-ui-dialog-close]")) closeDialog(dialog);
    });
    dialog.addEventListener("close", () => {
      const opener = dialogOpeners.get(dialog);
      dialogOpeners.delete(dialog);
      opener?.focus();
    });
  }
  if (dialogOpenersBound) return;
  dialogOpenersBound = true;
  document.addEventListener("click", (event) => {
    const opener = (event.target as HTMLElement).closest<HTMLElement>("[data-ui-dialog-open]");
    if (!opener) return;
    const dialog = document.getElementById(opener.dataset.uiDialogOpen ?? "");
    if (dialog instanceof HTMLDialogElement) openDialog(dialog, opener);
  });
}

/* ---------- Astro Drawer ([data-ui-drawer]) ---------- */

interface DrawerState {
  opener: HTMLElement | null;
  unlock?: () => void;
}

const drawerState = new WeakMap<HTMLElement, DrawerState>();

function drawerToggles(drawer: HTMLElement): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(`[data-ui-drawer-toggle="${drawer.id}"]`));
}

function isModal(drawer: HTMLElement): boolean {
  return drawer.dataset.modal !== "false";
}

export function openDrawer(drawer: HTMLElement, opener?: HTMLElement | null): void {
  if (drawer.dataset.state === "open") return;
  const modal = isModal(drawer);
  drawerState.set(drawer, {
    opener: opener ?? (document.activeElement as HTMLElement | null),
    unlock: modal ? lockScroll() : undefined,
  });
  drawer.dataset.state = "open";
  drawer.inert = false;
  for (const toggle of drawerToggles(drawer)) toggle.setAttribute("aria-expanded", "true");
  const panel = drawer.querySelector<HTMLElement>(".ui-drawer__panel");
  if (panel) (focusableIn(panel)[0] ?? panel).focus();
  drawer.dispatchEvent(new CustomEvent("ui:drawer-open"));
}

export function closeDrawer(drawer: HTMLElement, restoreFocus = true): void {
  if (drawer.dataset.state !== "open") return;
  const state = drawerState.get(drawer);
  drawerState.delete(drawer);
  state?.unlock?.();
  drawer.dataset.state = "closed";
  drawer.inert = true;
  for (const toggle of drawerToggles(drawer)) toggle.setAttribute("aria-expanded", "false");
  if (restoreFocus && drawer.contains(document.activeElement)) state?.opener?.focus();
  drawer.dispatchEvent(new CustomEvent("ui:drawer-close"));
}

export function bindDrawers(): void {
  for (const drawer of document.querySelectorAll<HTMLElement>("[data-ui-drawer]")) {
    if (drawer.dataset.bound === "1") continue;
    drawer.dataset.bound = "1";
    drawer.inert = drawer.dataset.state !== "open";
    for (const toggle of drawerToggles(drawer)) {
      toggle.setAttribute("aria-controls", drawer.id);
      toggle.setAttribute("aria-expanded", String(drawer.dataset.state === "open"));
    }
    drawer.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      if (target.closest(".ui-drawer__scrim, [data-ui-drawer-close]")) closeDrawer(drawer);
      else if (target.closest("a[href]")) closeDrawer(drawer, false);
    });
    drawer.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeDrawer(drawer);
        return;
      }
      const panel = drawer.querySelector<HTMLElement>(".ui-drawer__panel");
      if (panel && isModal(drawer)) trapTab(panel, event);
    });
  }
  if (drawerTogglesBound) return;
  drawerTogglesBound = true;
  document.addEventListener("click", (event) => {
    const toggle = (event.target as HTMLElement).closest<HTMLElement>("[data-ui-drawer-toggle]");
    if (!toggle) return;
    const drawer = document.getElementById(toggle.dataset.uiDrawerToggle ?? "");
    if (!drawer) return;
    if (drawer.dataset.state === "open") closeDrawer(drawer);
    else openDrawer(drawer, toggle);
  });
  document.addEventListener("astro:before-swap", () => {
    for (const drawer of document.querySelectorAll<HTMLElement>("[data-ui-drawer][data-state='open']")) {
      closeDrawer(drawer, false);
    }
  });
}

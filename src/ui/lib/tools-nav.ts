/**
 * Tool groups in the rail nav (SiteNavTools). One group is open at a time.
 * While ToolsShell is mounted, plain clicks on tool links become a
 * `tools:select` event so the shell swaps the tool in place; the shell answers
 * with `tools:route` and every copy of the nav (rail and phone menu) follows.
 */

import { closeDrawer } from "./overlay";

export type ToolsSelectDetail = { slug: string | null };
export type ToolsRouteDetail = { slug: string | null };

function setOpen(group: HTMLElement, open: boolean): void {
  const toggle = group.querySelector<HTMLElement>(":scope > .ui-site-nav__group-toggle");
  const list = group.querySelector<HTMLElement>(":scope > .ui-site-nav__sub");
  toggle?.setAttribute("aria-expanded", String(open));
  if (list) list.hidden = !open;
  syncGroupCurrent(group);
}

/** A collapsed group stands in for its current tool under the marker. */
function syncGroupCurrent(group: HTMLElement): void {
  const toggle = group.querySelector<HTMLElement>(":scope > .ui-site-nav__group-toggle");
  const holdsCurrent = Boolean(group.querySelector("a[aria-current='page']"));
  const open = toggle?.getAttribute("aria-expanded") === "true";
  if (holdsCurrent && !open) toggle?.setAttribute("aria-current", "true");
  else toggle?.removeAttribute("aria-current");
}

function openOnly(nav: HTMLElement, groupId: string | undefined): void {
  nav.querySelectorAll<HTMLElement>(".ui-site-nav__group").forEach((group) => {
    setOpen(group, group.dataset.group === groupId);
  });
}

function isPlainClick(event: MouseEvent): boolean {
  return !(event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);
}

function markCurrent(nav: HTMLElement, slug: string | null): void {
  let groupId: string | undefined;
  nav.querySelectorAll<HTMLAnchorElement>("a[data-tool-slug]").forEach((link) => {
    const current = link.dataset.toolSlug === slug;
    if (current) {
      link.setAttribute("aria-current", "page");
      groupId = link.closest<HTMLElement>(".ui-site-nav__group")?.dataset.group;
    } else {
      link.removeAttribute("aria-current");
    }
  });
  if (groupId) openOnly(nav, groupId);
  else nav.querySelectorAll<HTMLElement>(".ui-site-nav__group").forEach(syncGroupCurrent);
}

function bindToolsNav(nav: HTMLElement): void {
  nav.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const toggle = target.closest<HTMLElement>(".ui-site-nav__group-toggle");
    if (toggle) {
      const group = toggle.closest<HTMLElement>(".ui-site-nav__group");
      const open = toggle.getAttribute("aria-expanded") === "true";
      openOnly(nav, open ? undefined : group?.dataset.group);
      return;
    }
    const link = target.closest<HTMLAnchorElement>("a[data-tool-slug]");
    if (!link || !isPlainClick(event) || !document.querySelector(".tools-shell")) return;
    event.preventDefault();
    window.dispatchEvent(new CustomEvent<ToolsSelectDetail>("tools:select", { detail: { slug: link.dataset.toolSlug ?? null } }));
  });
}

let routeBound = false;

export function bindToolsNavs(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-ui-tools-nav]").forEach((nav) => {
    if (nav.dataset.toolsBound === "1") return;
    nav.dataset.toolsBound = "1";
    bindToolsNav(nav);
    nav.querySelectorAll<HTMLElement>(".ui-site-nav__group").forEach(syncGroupCurrent);
  });
  if (routeBound) return;
  routeBound = true;
  window.addEventListener("tools:route", (event) => {
    const { slug } = (event as CustomEvent<ToolsRouteDetail>).detail;
    document.querySelectorAll<HTMLElement>("[data-ui-tools-nav]").forEach((nav) => markCurrent(nav, slug));
    document.querySelectorAll<HTMLElement>("[data-ui-site-menu][data-state='open']").forEach((drawer) => closeDrawer(drawer, false));
  });
}

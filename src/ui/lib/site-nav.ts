/** Shared data and path rules for SiteHeader / SiteNav (Astro and React). */

export interface NavItem {
  href: string;
  label: string;
  glyph?: string;
  ariaLabel?: string;
}

export type ShellMode = "rail" | "app" | "immersive";

// U+FE0E keeps the cross as a text glyph instead of an emoji on iOS.
export const defaultNavItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/orthodox", label: "Orthodox", glyph: "☦︎", ariaLabel: "Orthodox" },
  { href: "/projects", label: "Projects" },
  { href: "/tools", label: "Tools" },
  { href: "/keys", label: "Keys" },
  { href: "/connect", label: "Connect" },
];

export function isCurrentPath(href: string, currentPath: string): boolean {
  if (href === "/") return currentPath === "/" || currentPath === "";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function shellMode(currentPath: string, immersive = false): ShellMode {
  if (immersive) return "immersive";
  return /^\/(tools|chat)(\/|$)/.test(currentPath) ? "app" : "rail";
}

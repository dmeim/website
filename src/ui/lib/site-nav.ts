/** Shared data and path rules for SiteHeader / SiteNav (Astro and React). */

export interface NavItem {
  href: string;
  label: string;
  glyph?: string;
  ariaLabel?: string;
}

export type ShellMode = "rail" | "immersive";

// U+FE0E keeps the cross as a text glyph instead of an emoji on iOS.
export const defaultNavItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/orthodox", label: "Orthodox", glyph: "☦︎", ariaLabel: "Orthodox" },
  { href: "/projects", label: "Projects" },
  { href: "/gallery", label: "Gallery" },
  { href: "/tools", label: "Tools" },
  { href: "/keys", label: "Keys" },
];

export function isCurrentPath(href: string, currentPath: string): boolean {
  if (href === "/") return currentPath === "/" || currentPath === "";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function shellMode(immersive = false): ShellMode {
  return immersive ? "immersive" : "rail";
}

export type NavLink = {
  label: string;
  href: string;
};

export const navLinks: NavLink[] = [
  { label: "Work", href: "/projects" },
  { label: "Tools", href: "/tools" },
  { label: "Keys", href: "/keys" },
  { label: "Connect", href: "/connect" },
];

export type PalettePage = NavLink & {
  hint: string;
  keywords: string;
};

export const palettePages: PalettePage[] = [
  { label: "Home", href: "/", hint: "Start here", keywords: "index landing" },
  { label: "Work", href: "/projects", hint: "Projects and case studies", keywords: "projects portfolio" },
  { label: "Tools", href: "/tools", hint: "Local-first utilities", keywords: "utilities apps" },
  { label: "Keys", href: "/keys", hint: "SSH and GPG fingerprints", keywords: "pgp ssh gpg verify trust" },
  { label: "Connect", href: "/connect", hint: "Get in touch", keywords: "contact email message" },
  { label: "Orthodox", href: "/orthodox", hint: "Icon wall", keywords: "icons screensaver" },
];

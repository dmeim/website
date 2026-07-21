/**
 * Site content for dmeim.com
 * Visual structure adapted from Midnight Concert Hall reference.
 */

export type Cta = {
  label: string;
  href: string;
};

export type Appointment = {
  title: string;
  organization: string;
  location?: string;
  dates: string;
  bullets?: string[];
  image: string;
  url: string;
};

export type FormField = {
  name: "name" | "email" | "subject" | "message";
  label: string;
  type: "text" | "email" | "textarea";
  placeholder: string;
  required: boolean;
};

export type SiteMeta = {
  title: string;
  description: string;
};

export type HeroContent = {
  name: string;
  role: string;
  sentence: string;
  ctas: Cta[];
};

export type CurrentChapter = {
  eyebrow: string;
  title: string;
  body: string;
};

export type MentorQuote = {
  text: string;
  attribution?: string;
};

export type PedagogyItem = {
  title: string;
  body: string;
};

export type Endorsement = {
  label: string;
  url: string;
};

export type VenueHighlight = {
  name: string;
  place: string;
  image: string;
};

export type ConnectContent = {
  email: string;
  location: string;
  locationDetail: string;
  socialUrl: string;
  socialHandle: string;
  socialLabel: string;
  intro: string;
  form: {
    submitLabel: string;
    fields: FormField[];
  };
};

export type ProjectItem = {
  slug: string;
  title: string;
  summary: string;
  status: "live" | "wip" | "archived";
  tags: string[];
  href?: string;
  image: string;
};

export type KeyBlock = {
  id: string;
  title: string;
  kind: "SSH" | "GPG" | "Other";
  fingerprint: string;
  usage: string;
  body: string;
};

export type SiteContent = {
  meta: SiteMeta;
  hero: HeroContent;
  currentChapter: CurrentChapter;
  appointments: Appointment[];
  shortBio: string;
  mentorQuote: MentorQuote;
  pedagogy: PedagogyItem[];
  endorsement: Endorsement;
  connect: ConnectContent;
  venues: VenueHighlight[];
  projects: ProjectItem[];
  keys: KeyBlock[];
};

export const meta: SiteMeta = {
  title: "dmeim.com | Dimitri",
  description:
    "Personal site for Dimitri (dmeim) — projects, tools, public keys, and ways to connect.",
};

export const hero: HeroContent = {
  name: "dmeim",
  role: "Builder · Operator · Security-minded engineer",
  sentence:
    "Portfolios, public keys, verification tools, and experiments — a quiet stage for the work.",
  ctas: [
    { label: "Connect", href: "/connect" },
    { label: "Projects", href: "/projects" },
  ],
};

export const currentChapter: CurrentChapter = {
  eyebrow: "Current chapter",
  title: "Building dmeim.com in public",
  body: "This site is the home base for Dimitri’s projects, public encryption keys, and upcoming tools. The aesthetic borrows from a midnight concert hall — dark ground, champagne and steel accents — while the content stays focused on craft, clarity, and trust.",
};

export const appointments: Appointment[] = [
  {
    title: "Personal platform",
    organization: "dmeim.com",
    location: "Edge",
    dates: "2026–Present",
    image: "/images/project-1.svg",
    url: "/",
    bullets: [
      "Astro 7 on Cloudflare Workers Assets",
      "Keys, verification, and portfolio surfaces",
      "Design system: Midnight Concert Hall",
    ],
  },
  {
    title: "Portfolio & experiments",
    organization: "Projects",
    location: "Remote",
    dates: "Ongoing",
    image: "/images/project-2.svg",
    url: "/projects",
    bullets: [
      "Selected builds and case studies",
      "Lorem placeholder for deeper write-ups",
      "Tools landing soon under /tools",
    ],
  },
  {
    title: "Trust & identity",
    organization: "Keys",
    location: "Public",
    dates: "Ongoing",
    image: "/images/project-3.svg",
    url: "/keys",
    bullets: [
      "SSH and GPG fingerprints published openly",
      "Import guidance and usage notes",
      "Verification flows planned",
    ],
  },
];

/** ~150 words — seed bio for Dimitri / dmeim. */
export const shortBio = `Dimitri builds careful interfaces and trustworthy infrastructure. Through dmeim.com he publishes projects, shares public keys, and prepares tools that make verification and collaboration easier. The work favors clarity over spectacle: plain language, strong defaults, and systems that stay out of the way until you need them. This chapter is about assembling a durable personal platform — design, content, and security posture growing together — so collaborators, clients, and curious visitors can find what they need without noise.`;

export const mentorQuote: MentorQuote = {
  text: "Build for the people who will verify you later — publish fingerprints, prefer boring reliability, and leave the stage quiet enough that the work can be heard.",
  attribution: "Working principle",
};

const focusPlaceholder =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.";

export const pedagogy: PedagogyItem[] = [
  {
    title: "Clarity before cleverness",
    body: focusPlaceholder,
  },
  {
    title: "Security as a first-class surface",
    body: focusPlaceholder,
  },
  {
    title: "Edge-native, static-first delivery",
    body: focusPlaceholder,
  },
  {
    title: "Motion that serves hierarchy",
    body: focusPlaceholder,
  },
  {
    title: "Document decisions, not just code",
    body: focusPlaceholder,
  },
];

export const endorsement: Endorsement = {
  label: "GitHub · @dmeim",
  url: "https://github.com/dmeim",
};

export const connect: ConnectContent = {
  email: "hello@dmeim.com",
  location: "Remote",
  locationDetail: "Available for thoughtful collaborations and questions",
  socialUrl: "https://github.com/dmeim",
  socialHandle: "@dmeim",
  socialLabel: "GitHub",
  intro:
    "Whether you're interested in collaboration, keys, or just want to say hello — I'd love to hear from you.",
  form: {
    submitLabel: "Send Message",
    fields: [
      {
        name: "name",
        label: "Name",
        type: "text",
        placeholder: "Your name",
        required: true,
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        placeholder: "your@email.com",
        required: true,
      },
      {
        name: "subject",
        label: "Subject",
        type: "text",
        placeholder: "What's this about?",
        required: true,
      },
      {
        name: "message",
        label: "Message",
        type: "textarea",
        placeholder: "Your message...",
        required: true,
      },
    ],
  },
};

export const venues: VenueHighlight[] = [
  {
    name: "Astro 7",
    place: "Islands · TypeScript",
    image: "/images/highlight-1.svg",
  },
  {
    name: "Cloudflare",
    place: "Workers Assets",
    image: "/images/highlight-2.svg",
  },
  {
    name: "Framer Motion",
    place: "Scroll choreography",
    image: "/images/highlight-3.svg",
  },
  {
    name: "Open keys",
    place: "SSH · GPG",
    image: "/images/highlight-4.svg",
  },
];

export const projects: ProjectItem[] = [
  {
    slug: "dmeim-com",
    title: "dmeim.com",
    summary:
      "Personal platform — Midnight Concert Hall design, keys, and connect surfaces on Cloudflare.",
    status: "wip",
    tags: ["Astro", "Cloudflare", "Design"],
    href: "/",
    image: "/images/project-1.svg",
  },
  {
    slug: "georgios-zerdalis",
    title: "Georgios Zerdalis",
    summary:
      "Portfolio site for a timpanist & educator — the design reference transferred into this project.",
    status: "live",
    tags: ["Astro", "Motion", "Portfolio"],
    href: "https://github.com/dmeim/georgios-zerdalis",
    image: "/images/project-2.svg",
  },
  {
    slug: "verification-lab",
    title: "Verification lab",
    summary:
      "Lorem ipsum placeholder for in-browser PGP and SSH/Ed25519 verification tools.",
    status: "wip",
    tags: ["Security", "OpenPGP", "SSH"],
    image: "/images/project-3.svg",
  },
  {
    slug: "edge-experiments",
    title: "Edge experiments",
    summary:
      "Lorem ipsum dolor sit amet — Workers, bindings, and small utilities awaiting write-ups.",
    status: "archived",
    tags: ["Workers", "R2", "KV"],
    image: "/images/project-4.svg",
  },
];

export const keys: KeyBlock[] = [
  {
    id: "ssh-ed25519",
    title: "SSH · Ed25519",
    kind: "SSH",
    fingerprint: "SHA256:loremIpsumPlaceholderFingerprintDoNotTrust",
    usage: "ssh-keygen -Y verify · authorized_keys",
    body: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILoremIpsumPlaceholderKeyMaterialOnlyXXXX hello@dmeim.com`,
  },
  {
    id: "gpg-primary",
    title: "GPG · Primary",
    kind: "GPG",
    fingerprint: "AAAA BBBB CCCC DDDD EEEE  FFFF 0000 1111 2222 3333",
    usage: "gpg --import · gpg --verify",
    body: `-----BEGIN PGP PUBLIC KEY BLOCK-----
Comment: Placeholder — replace with real key material

mDMEAAAAABYJKwYBBAHaRw8BAQdALoremIpsumPlaceholderGpgBlockOnly
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
=XXXX
-----END PGP PUBLIC KEY BLOCK-----`,
  },
];

export const site: SiteContent = {
  meta,
  hero,
  currentChapter,
  appointments,
  shortBio,
  mentorQuote,
  pedagogy,
  endorsement,
  connect,
  venues,
  projects,
  keys,
};

export default site;

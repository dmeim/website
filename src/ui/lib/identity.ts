import { connect } from "@/content/site";
import type { IconName } from "@/ui/icons/registry";

export const fullName = "Dimitrios Meimaridis";

export interface ContactLink {
  label: string;
  href: string;
  icon: IconName;
  external: boolean;
}

// Forgejo has no Phosphor logo; git-branch is the closest match to its mark.
export const contactLinks: ContactLink[] = [
  { label: "GitHub", href: connect.socialUrl, icon: "github-logo", external: true },
  { label: "Forgejo", href: connect.forgejoUrl, icon: "git-branch", external: true },
  { label: "Email", href: `mailto:${connect.email}`, icon: "envelope-simple", external: false },
];

/**
 * Normalises appointments and projects into one index for the work list.
 */
import { appointments, projects } from "../../../content/site";

export const statusLabel = { live: "Live", wip: "In progress", archived: "Archived" } as const;

export type WorkStatus = keyof typeof statusLabel;

export type WorkRowData = {
  title: string;
  org: string;
  dates: string;
  tags: string[];
  href: string;
  external: boolean;
  summary?: string;
  bullets?: string[];
  status?: WorkStatus;
};

export function workRows(): WorkRowData[] {
  return [
    ...appointments.map((a) => ({
      title: a.title,
      org: a.organization,
      dates: a.dates,
      tags: a.location ? [a.location] : [],
      href: a.url,
      external: false,
      bullets: a.bullets,
    })),
    ...projects.map((p) => ({
      title: p.title,
      org: "Project",
      dates: statusLabel[p.status],
      tags: p.tags,
      // Projects without their own page fall back to the projects index.
      href: p.href ?? "/projects",
      external: Boolean(p.href?.startsWith("http")),
      summary: p.summary,
      status: p.status,
    })),
  ];
}

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

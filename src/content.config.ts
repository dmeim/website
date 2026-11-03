import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const mediaWords = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  alt: z.string().optional(),
});

/**
 * One Markdown file per project in `src/content/projects/`; the file name is
 * the URL slug. Photos and video go in `src/assets/gallery/projects/<slug>/` and use
 * the gallery's rules (see `src/content/gallery.ts`).
 */
const projects = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    /** One line for the stack caption, the homepage and the page lede. */
    summary: z.string(),
    status: z.enum(["live", "wip", "archived"]),
    /** Lower comes first; unordered projects follow by title. */
    order: z.number().int().optional(),
    /** Free text: "2026", "2025–2026", "Ongoing". */
    year: z.string().optional(),
    role: z.string().optional(),
    tags: z.array(z.string()).default([]),
    links: z
      .array(
        z.object({
          label: z.string(),
          href: z.url(),
          kind: z.enum(["site", "source", "other"]).default("other"),
        }),
      )
      .default([]),
    /** File stem in the media folder for the top of the stack. */
    cover: z.string().optional(),
    /** Words for media files, keyed by file stem; listed ones come first. */
    media: z.record(z.string(), mediaWords).default({}),
  }),
});

export const collections = { projects };

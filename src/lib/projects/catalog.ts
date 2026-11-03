import { albumsFromFiles } from "../gallery/catalog";
import type { GalleryAlbum, GalleryAlbumMeta, GalleryFile } from "../gallery/types";

export type ProjectStatus = "live" | "wip" | "archived";

export const statusLabel: Record<ProjectStatus, string> = {
  live: "Live",
  wip: "In progress",
  archived: "Archived",
};

/** The frontmatter fields the media pairing needs. */
export type ProjectMediaSource = {
  slug: string;
  title: string;
  summary: string;
  cover?: string;
  media: GalleryAlbumMeta["items"];
};

/**
 * Pair each project with its media folder (`<slug>/<file>`) as a gallery
 * album. Projects without a folder get none. Fails on a folder with no
 * project (usually a renamed .md) and on media words for a project with no
 * folder, so typos surface at build time.
 */
export function projectAlbums(
  files: Record<string, GalleryFile>,
  projects: ProjectMediaSource[],
): Map<string, GalleryAlbum> {
  const folders = new Set(Object.keys(files).map((path) => path.split("/")[0]));
  const slugs = new Set(projects.map((project) => project.slug));

  for (const folder of folders) {
    if (!slugs.has(folder)) {
      throw new Error(`[projects] media folder "${folder}" has no src/content/projects/${folder}.md`);
    }
  }

  const meta: Record<string, GalleryAlbumMeta> = {};
  for (const project of projects) {
    const hasWords = Object.keys(project.media ?? {}).length > 0 || project.cover;
    if (!folders.has(project.slug)) {
      if (hasWords) throw new Error(`[projects] "${project.slug}" names media but src/assets/gallery/projects/${project.slug}/ is missing`);
      continue;
    }
    meta[project.slug] = {
      title: project.title,
      description: project.summary,
      cover: project.cover,
      items: project.media,
    };
  }

  return new Map(albumsFromFiles(files, meta).map((album) => [album.slug, album]));
}

/** `order` first (lower first), then title. */
export function compareProjects(
  a: { order?: number; title: string },
  b: { order?: number; title: string },
): number {
  const rank = (order?: number) => order ?? Number.POSITIVE_INFINITY;
  return rank(a.order) - rank(b.order) || a.title.localeCompare(b.title);
}

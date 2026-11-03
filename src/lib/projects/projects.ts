import { getCollection, type CollectionEntry } from "astro:content";

import { loadFolder, PROJECTS_FOLDER } from "../gallery/assets";
import type { GalleryAlbum } from "../gallery/types";
import { compareProjects, projectAlbums } from "./catalog";

export type Project = {
  slug: string;
  entry: CollectionEntry<"projects">;
  data: CollectionEntry<"projects">["data"];
  /** Photos and video from `src/assets/gallery/projects/<slug>/`, if any. */
  album?: GalleryAlbum;
};

let cached: Promise<Project[]> | undefined;

/** Every project in display order, with media optimized once per build. */
export function loadProjects(): Promise<Project[]> {
  cached ??= (async () => {
    const [entries, files] = await Promise.all([
      getCollection("projects"),
      loadFolder(PROJECTS_FOLDER),
    ]);
    const albums = projectAlbums(
      files,
      entries.map(({ id, data }) => ({
        slug: id,
        title: data.title,
        summary: data.summary,
        cover: data.cover,
        media: data.media,
      })),
    );
    return entries
      .map((entry) => ({ slug: entry.id, entry, data: entry.data, album: albums.get(entry.id) }))
      .sort((a, b) => compareProjects(a.data, b.data));
  })();
  return cached;
}

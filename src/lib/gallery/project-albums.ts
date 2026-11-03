import { loadProjects } from "../projects/projects";
import { PROJECTS_FOLDER } from "./assets";
import type { GalleryAlbum } from "./types";

/** Each project's media as a gallery album at `/gallery/projects/<slug>`, in project order. */
export async function loadProjectAlbums(): Promise<GalleryAlbum[]> {
  const projects = await loadProjects();
  return projects.flatMap(({ album }) => (album ? [{ ...album, slug: `${PROJECTS_FOLDER}/${album.slug}` }] : []));
}

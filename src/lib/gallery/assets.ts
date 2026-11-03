import type { ImageMetadata } from "astro";

import { albumMeta, albumOrder } from "../../content/gallery";
import { albumsFromFiles, relativeTo } from "./catalog";
import { filesFromGlobs } from "./media";
import type { GalleryAlbum, GalleryFile } from "./types";

/** Every image and media file the site uses lives under this folder. */
export const GALLERY_ROOT = "/src/assets/gallery/";

/** Holds one sub-folder per project; listed by the projects loader, not as one album. */
export const PROJECTS_FOLDER = "projects";

// Each folder is an album, each sub-folder a section of it; drop files in and
// they appear. Globs must be literals; catalog.test.ts checks these lists
// match catalog's extensions.
const stillModules = import.meta.glob<ImageMetadata>(
  "/src/assets/gallery/**/*.{jpg,jpeg,png,webp,avif,gif}",
  { eager: true, import: "default" },
);

// `?url` emits each file byte-for-byte: the full-quality preview, downloads,
// GIFs (which must keep animating) and video/audio.
const originalUrls = import.meta.glob<string>(
  "/src/assets/gallery/**/*.{jpg,jpeg,png,webp,avif,gif,mp4,webm,mov,m4v,mp3,m4a,aac,ogg,oga,opus,wav,flac}",
  { eager: true, query: "?url", import: "default" },
);

let files: Promise<Record<string, GalleryFile>> | undefined;
let albums: Promise<GalleryAlbum[]> | undefined;

/** Every gallery file keyed by its path inside the gallery root, processed once per build. */
export function loadGalleryFiles(): Promise<Record<string, GalleryFile>> {
  files ??= filesFromGlobs(stillModules, originalUrls).then((all) => relativeTo(GALLERY_ROOT, all));
  return files;
}

/** Files under one top-level folder, keyed by their path inside it. */
export async function loadFolder(folder: string): Promise<Record<string, GalleryFile>> {
  const prefix = `${folder}/`;
  const all = await loadGalleryFiles();
  return relativeTo(prefix, Object.fromEntries(Object.entries(all).filter(([path]) => path.startsWith(prefix))));
}

/** Every album except the projects folder. */
export function loadAlbums(): Promise<GalleryAlbum[]> {
  albums ??= loadGalleryFiles().then((all) =>
    albumsFromFiles(
      Object.fromEntries(Object.entries(all).filter(([path]) => !path.startsWith(`${PROJECTS_FOLDER}/`))),
      albumMeta,
      albumOrder,
    ),
  );
  return albums;
}

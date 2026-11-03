import { titleFromFilename } from "../orthodox/catalog";
import type { GalleryAlbum, GalleryAlbumMeta, GalleryFile, GalleryItem, GalleryKind } from "./types";

const EXTENSIONS: Record<GalleryKind, readonly string[]> = {
  image: ["jpg", "jpeg", "png", "webp", "avif", "gif"],
  video: ["mp4", "webm", "mov", "m4v"],
  audio: ["mp3", "m4a", "aac", "ogg", "oga", "opus", "wav", "flac"],
};

const MIME: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  opus: "audio/ogg",
  wav: "audio/wav",
  flac: "audio/flac",
};

function extensionOf(path: string) {
  return path.slice(path.lastIndexOf(".") + 1).toLowerCase();
}

/** Which kind a file is by extension, or undefined when the gallery ignores it. */
export function kindOf(path: string): GalleryKind | undefined {
  const ext = extensionOf(path);
  return (Object.keys(EXTENSIONS) as GalleryKind[]).find((kind) => EXTENSIONS[kind].includes(ext));
}

export function mimeOf(path: string): string {
  const mime = MIME[extensionOf(path)];
  if (!mime) throw new Error(`[gallery] no media type for "${path}"`);
  return mime;
}

/** Brace list for `import.meta.glob`, e.g. `jpg,png,mp4`. Globs must be literals, so this is checked in tests. */
export const ALL_EXTENSIONS = Object.values(EXTENSIONS).flat();

function compareNames(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function stemOf(file: string) {
  return file.replace(/\.[^.]+$/, "");
}

/** Stems named in `order` come first, in that order; the rest follow by filename. */
function rankBy(order: readonly string[]) {
  return (id: string) => {
    const index = order.indexOf(id);
    return index === -1 ? order.length : index;
  };
}

type FolderFile = { section?: string; file: string; entry: GalleryFile };

/**
 * Turn one album's files into items. A video or audio file takes the image
 * with the same stem (in the same folder) as its poster or cover art; that
 * image is not listed on its own. Two playable files or two images sharing an
 * id is an error.
 */
function itemsFromFolder(slug: string, files: FolderFile[], meta: GalleryAlbumMeta): GalleryItem[] {
  const stills = new Map<string, { section?: string; entry: Extract<GalleryFile, { kind: "image" }> }>();
  const playables = new Map<string, { section?: string; entry: Extract<GalleryFile, { kind: "video" | "audio" }> }>();
  for (const { section, file, entry } of files) {
    const stem = stemOf(file);
    const id = section ? `${section}/${stem}` : stem;
    if (entry.kind === "image") {
      if (stills.has(id)) throw new Error(`[gallery] "${slug}" has two images named "${id}"`);
      stills.set(id, { section, entry });
    } else {
      if (playables.has(id)) throw new Error(`[gallery] "${slug}" has two media files named "${id}"`);
      playables.set(id, { section, entry });
    }
  }

  const words = (id: string) => {
    const entry = meta.items?.[id] ?? {};
    const title = entry.title ?? titleFromFilename(id.split("/").pop() ?? id);
    return { title, description: entry.description ?? "", alt: entry.alt ?? title };
  };

  const items: GalleryItem[] = [];
  for (const [id, { section, entry }] of playables) {
    const poster = stills.get(id);
    stills.delete(id);
    items.push({
      id,
      section,
      kind: entry.kind,
      animated: false,
      ...words(id),
      still: poster && stillOf(poster.entry),
      media: { src: entry.original, mime: entry.mime },
      original: entry.original,
    });
  }
  for (const [id, { section, entry }] of stills) {
    items.push({ id, section, kind: "image", animated: entry.animated, ...words(id), still: stillOf(entry), original: entry.original });
  }
  return items;
}

function stillOf({ src, thumb, width, height }: Extract<GalleryFile, { kind: "image" }>) {
  return { src, thumb, width, height };
}

/** `<album>/<file>` or `<album>/<section>/<file>`; anything else is a layout error. */
function splitPath(path: string): { slug: string; section?: string; file: string } {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 2) return { slug: parts[0], file: parts[1] };
  if (parts.length === 3) return { slug: parts[0], section: parts[1], file: parts[2] };
  throw new Error(`[gallery] "${path}" must sit in <album>/ or <album>/<section>/`);
}

/**
 * Group build-time file entries, keyed by their path inside the gallery root
 * (`<album>/<file>` or `<album>/<section>/<file>`), into albums. A sub-folder
 * is a section of its album. Metadata only adds words and order; folders
 * decide what exists. Throws when metadata names an album, item or cover that
 * is not on disk, so typos fail the build.
 */
export function albumsFromFiles(
  entries: Record<string, GalleryFile>,
  metaByAlbum: Record<string, GalleryAlbumMeta>,
  albumOrder: readonly string[] = [],
): GalleryAlbum[] {
  const folders = new Map<string, FolderFile[]>();
  for (const [path, entry] of Object.entries(entries)) {
    const { slug, section, file } = splitPath(path);
    const list = folders.get(slug) ?? [];
    list.push({ section, file, entry });
    folders.set(slug, list);
  }

  for (const slug of Object.keys(metaByAlbum)) {
    if (!folders.has(slug)) {
      throw new Error(`[gallery] metadata for album "${slug}" has no folder`);
    }
  }

  const albumRank = rankBy(albumOrder);
  return [...folders.entries()]
    .map(([slug, files]) => {
      const meta = metaByAlbum[slug] ?? {};
      const sectionRank = rankBy(meta.sections ?? []);
      const sectionIds = [...new Set(files.flatMap(({ section }) => (section ? [section] : [])))].sort(
        (a, b) => sectionRank(a) - sectionRank(b) || compareNames(a, b),
      );
      // Loose files come before the sections.
      const sectionOf = (item: GalleryItem) => (item.section ? sectionIds.indexOf(item.section) : -1);
      const rank = rankBy(Object.keys(meta.items ?? {}));
      const items = itemsFromFolder(slug, files, meta).sort(
        (a, b) => sectionOf(a) - sectionOf(b) || rank(a.id) - rank(b.id) || compareNames(a.id, b.id),
      );

      const ids = new Set(items.map((item) => item.id));
      for (const id of Object.keys(meta.items ?? {})) {
        if (!ids.has(id)) throw new Error(`[gallery] "${slug}" metadata names missing item "${id}"`);
      }
      const cover = meta.cover ? items.find((item) => item.id === meta.cover) : items[0];
      if (!cover) throw new Error(`[gallery] "${slug}" cover "${meta.cover}" is not in the album`);

      return {
        slug,
        title: meta.title ?? titleFromFilename(slug),
        description: meta.description ?? "",
        sections: sectionIds.map((id) => ({ id, label: meta.sectionLabels?.[id] ?? titleFromFilename(id) })),
        download: meta.download ?? true,
        cover,
        items,
      };
    })
    .sort((a, b) => albumRank(a.slug) - albumRank(b.slug) || compareNames(a.title, b.title));
}

/** Re-key glob paths to their path inside `root` (e.g. `/src/assets/gallery/`). */
export function relativeTo<T>(root: string, entries: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(entries).map(([path, value]) => {
      if (!path.startsWith(root)) throw new Error(`[gallery] "${path}" is outside ${root}`);
      return [path.slice(root.length), value];
    }),
  );
}

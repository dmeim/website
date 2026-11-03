/** Optional words for one item, keyed by its id (`<stem>`, or `<section>/<stem>`) in `src/content/gallery.ts`. */
export type GalleryItemMeta = {
  title?: string;
  description?: string;
  /** Text alternative for images and posters; defaults to the title. */
  alt?: string;
};

/** Optional words and ordering for one album folder. */
export type GalleryAlbumMeta = {
  title?: string;
  description?: string;
  /** Id of the item on top of the stack; defaults to the first item. */
  cover?: string;
  /** Listed ids come first, in this order; the rest follow by filename. */
  items?: Record<string, GalleryItemMeta>;
  /** Sub-folder (section) order; folders not listed follow alphabetically. */
  sections?: readonly string[];
  /** Section headings; defaults to a title made from the folder name. */
  sectionLabels?: Record<string, string>;
  /** Offer the original file for download. Defaults to true. */
  download?: boolean;
};

export type GalleryKind = "image" | "video" | "audio";

/** Build-time URLs for a still image. */
export type GalleryStill = {
  /** Preview `src`: the untouched original, so the preview is full quality and GIFs keep animating. */
  src: string;
  /** Small WebP for grids and stacks. */
  thumb: string;
  width: number;
  height: number;
};

/** One file on disk, before pairing and metadata. */
export type GalleryFile =
  | ({ kind: "image"; original: string; animated: boolean } & GalleryStill)
  | { kind: "video" | "audio"; original: string; mime: string };

export type GalleryItem = {
  /** `<stem>`, or `<section>/<stem>` inside a sub-folder; unique within its album and used as the URL hash. */
  id: string;
  /** Sub-folder the file sits in, if any. */
  section?: string;
  kind: GalleryKind;
  /** GIF stills are flagged so thumbnails can say so. */
  animated: boolean;
  title: string;
  description: string;
  alt: string;
  /** The image itself, or a video's poster / an audio file's cover art (same stem). */
  still?: GalleryStill;
  /** Playable file for video and audio. */
  media?: { src: string; mime: string };
  /** The untouched file, for download. */
  original: string;
};

export type GalleryAlbum = {
  /** Folder path under `src/assets/gallery/`; the album lives at `/gallery/<slug>`. */
  slug: string;
  title: string;
  description: string;
  /** Sub-folders in display order; empty for a flat album. */
  sections: Array<{ id: string; label: string }>;
  download: boolean;
  cover: GalleryItem;
  items: GalleryItem[];
};

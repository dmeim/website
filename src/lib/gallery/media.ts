import type { ImageMetadata } from "astro";
import { getImage } from "astro:assets";

import { kindOf, mimeOf } from "./catalog";
import type { GalleryFile } from "./types";

const THUMB_WIDTH = 480;

/** The preview shows the original as-is; only the grid thumbnail is resized. */
async function stillFile(image: ImageMetadata, original: string): Promise<GalleryFile> {
  const thumb = await getImage({
    src: image,
    width: Math.min(THUMB_WIDTH, image.width),
    format: "webp",
    quality: 75,
  });
  return {
    kind: "image",
    original,
    animated: image.format === "gif",
    src: original,
    thumb: thumb.src,
    width: image.width,
    height: image.height,
  };
}

/**
 * Turn a pair of `import.meta.glob` results over the same folders into
 * gallery files: `stills` as ImageMetadata (for WebP thumbs), `originals` as
 * `?url` strings (emitted byte-for-byte for the preview, downloads, video
 * and audio). Callers own the globs because globs must be literals.
 */
export async function filesFromGlobs(
  stills: Record<string, ImageMetadata>,
  originals: Record<string, string>,
): Promise<Record<string, GalleryFile>> {
  const entries = await Promise.all(
    Object.entries(originals).map(async ([path, original]) => {
      const kind = kindOf(path);
      if (!kind) throw new Error(`[gallery] unsupported file "${path}"`);
      if (kind !== "image") return [path, { kind, original, mime: mimeOf(path) }] as const;
      const image = stills[path];
      if (!image) throw new Error(`[gallery] "${path}" did not load as an image`);
      return [path, await stillFile(image, original)] as const;
    }),
  );
  return Object.fromEntries(entries);
}

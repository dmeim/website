import type { ImageMetadata } from "astro";
import { getImage } from "astro:assets";

import {
  collectionLabels,
  collectionOrder,
  wallPresets,
} from "../../content/orthodox";
import { collectionsFrom, imagesFromGlob, titleFromFilename } from "./catalog";
import type {
  OrthodoxCollection,
  OrthodoxImage,
  WallBackground,
} from "./types";

// Drop files into these folders; nothing else needs registering.
const iconModules = import.meta.glob<ImageMetadata>(
  "/src/assets/orthodox/icons/*/*.{jpg,jpeg,png,webp,avif,svg}",
  { eager: true, import: "default" },
);

const backgroundModules = import.meta.glob<ImageMetadata>(
  "/src/assets/orthodox/backgrounds/*.{jpg,jpeg,png,webp,avif}",
  { eager: true, import: "default" },
);

// Originals stay full-size in the repo; the wall never needs more than this.
const ICON_WIDTH = 1200;
const BACKGROUND_WIDTH = 2560;

export type OrthodoxCatalog = {
  images: OrthodoxImage[];
  collections: OrthodoxCollection[];
  backgrounds: WallBackground[];
};

async function optimizedUrl(image: ImageMetadata, width: number) {
  if (image.format === "svg") return image.src;
  const result = await getImage({
    src: image,
    width: Math.min(width, image.width),
    format: "webp",
    quality: 80,
  });
  return result.src;
}

async function optimizeAll(
  modules: Record<string, ImageMetadata>,
  width: number,
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    Object.entries(modules).map(
      async ([path, image]) =>
        [path, await optimizedUrl(image, width)] as const,
    ),
  );
  return Object.fromEntries(entries);
}

export async function loadCatalog(): Promise<OrthodoxCatalog> {
  const images = imagesFromGlob(await optimizeAll(iconModules, ICON_WIDTH));
  const backgroundUrls = await optimizeAll(backgroundModules, BACKGROUND_WIDTH);
  const uploaded = Object.entries(backgroundUrls)
    .map(([path, src]) => {
      const file = path.split("/").pop() ?? path;
      return {
        id: `image:${file.replace(/\.[^.]+$/, "")}`,
        label: titleFromFilename(file),
        css: `url("${src}") center / cover no-repeat`,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    images,
    collections: collectionsFrom(images, collectionLabels, collectionOrder),
    backgrounds: [...uploaded, ...wallPresets],
  };
}

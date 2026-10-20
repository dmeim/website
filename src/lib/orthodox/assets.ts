import { collectionLabels, wallPresets } from "../../content/orthodox";
import { collectionsFrom, imagesFromGlob, titleFromFilename } from "./catalog";
import type {
  OrthodoxCollection,
  OrthodoxImage,
  WallBackground,
} from "./types";

// Drop files into these folders; nothing else needs registering.
const iconUrls = import.meta.glob<string>(
  "/src/assets/orthodox/icons/*/*.{jpg,jpeg,png,webp,avif,svg}",
  { eager: true, query: "?url", import: "default" },
);

const backgroundUrls = import.meta.glob<string>(
  "/src/assets/orthodox/backgrounds/*.{jpg,jpeg,png,webp,avif}",
  { eager: true, query: "?url", import: "default" },
);

export type OrthodoxCatalog = {
  images: OrthodoxImage[];
  collections: OrthodoxCollection[];
  backgrounds: WallBackground[];
};

export function loadCatalog(): OrthodoxCatalog {
  const images = imagesFromGlob(iconUrls);
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
    collections: collectionsFrom(images, collectionLabels),
    backgrounds: [...uploaded, ...wallPresets],
  };
}

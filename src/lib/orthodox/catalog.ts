import type { OrthodoxCollection, OrthodoxImage } from "./types";

/** "01-st-nicholas_of-myra.jpg" → "St Nicholas Of Myra" (numeric ordering prefixes are dropped). */
export function titleFromFilename(file: string): string {
  const stem = file.replace(/\.[^.]+$/, "").replace(/^\d+[-_ ]+/, "");
  return stem
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

/** Build the image list from `import.meta.glob` entries keyed by `…/<collection>/<file>`. */
export function imagesFromGlob(
  entries: Record<string, string>,
): OrthodoxImage[] {
  return Object.entries(entries)
    .map(([path, src]) => {
      const [collection, file] = path.split("/").slice(-2);
      return {
        id: `${collection}/${file.replace(/\.[^.]+$/, "")}`,
        src,
        title: titleFromFilename(file),
        collection,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Collections named in `order` come first, in that order; the rest follow alphabetically. */
export function collectionsFrom(
  images: OrthodoxImage[],
  labels: Record<string, string>,
  order: readonly string[] = [],
): OrthodoxCollection[] {
  const counts = new Map<string, number>();
  for (const image of images) {
    counts.set(image.collection, (counts.get(image.collection) ?? 0) + 1);
  }
  const rank = (id: string) => {
    const index = order.indexOf(id);
    return index === -1 ? order.length : index;
  };
  return [...counts.entries()]
    .map(([id, count]) => ({
      id,
      count,
      label: labels[id] ?? titleFromFilename(id),
    }))
    .sort((a, b) => rank(a.id) - rank(b.id) || a.label.localeCompare(b.label));
}

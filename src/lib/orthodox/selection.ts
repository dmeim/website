import type { OrthodoxImage } from "./types";

export const ALL_COLLECTIONS = "all";

export type Random = () => number;

export function poolFor(
  images: OrthodoxImage[],
  collection: string,
): OrthodoxImage[] {
  if (collection === ALL_COLLECTIONS) return images;
  return images.filter((image) => image.collection === collection);
}

/** Up to `count` distinct images in random order. */
export function pickImages(
  pool: OrthodoxImage[],
  count: number,
  random: Random = Math.random,
): OrthodoxImage[] {
  const copy = [...pool];
  const take = Math.min(count, copy.length);
  for (let i = 0; i < take; i += 1) {
    const j = i + Math.floor(random() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, take);
}

/**
 * Keep what is already hanging (if still in the pool) and top up or trim to
 * `count`, so changing the count doesn't reshuffle the whole wall.
 */
export function resizeSelection(
  current: OrthodoxImage[],
  pool: OrthodoxImage[],
  count: number,
  random: Random = Math.random,
): OrthodoxImage[] {
  const inPool = new Set(pool.map((image) => image.id));
  const kept = current.filter((image) => inPool.has(image.id)).slice(0, count);
  const keptIds = new Set(kept.map((image) => image.id));
  const extra = pickImages(
    pool.filter((image) => !keptIds.has(image.id)),
    count - kept.length,
    random,
  );
  return [...kept, ...extra];
}

/**
 * Swap one hanging image for one not currently shown. Returns `current`
 * unchanged when every image in the pool is already on the wall.
 */
export function rotateOne(
  current: OrthodoxImage[],
  pool: OrthodoxImage[],
  random: Random = Math.random,
): OrthodoxImage[] {
  const shown = new Set(current.map((image) => image.id));
  const unused = pool.filter((image) => !shown.has(image.id));
  if (current.length === 0 || unused.length === 0) return current;
  const slot = Math.floor(random() * current.length);
  const next = [...current];
  next[slot] = unused[Math.floor(random() * unused.length)];
  return next;
}

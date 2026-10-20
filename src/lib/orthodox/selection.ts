import type { CustomCard } from "./custom";
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

/** Which image each custom card is showing, keyed by card id. */
export type Assignment = Record<string, OrthodoxImage>;

function lockedImage(
  card: CustomCard,
  images: OrthodoxImage[],
): OrthodoxImage | undefined {
  if (card.lock.kind !== "icon") return undefined;
  const { imageId } = card.lock;
  return images.find((image) => image.id === imageId);
}

/** What a card may show: its group, or the wall's collection. */
function candidatesFor(
  card: CustomCard,
  images: OrthodoxImage[],
  wallPool: OrthodoxImage[],
): OrthodoxImage[] {
  if (card.lock.kind !== "collection") return wallPool;
  const group = poolFor(images, card.lock.collection);
  return group.length > 0 ? group : wallPool;
}

function pickOne(
  candidates: OrthodoxImage[],
  used: Set<string>,
  random: Random,
): OrthodoxImage | undefined {
  const fresh = candidates.filter((image) => !used.has(image.id));
  const from = fresh.length > 0 ? fresh : candidates;
  return from[Math.floor(random() * from.length)];
}

/**
 * Give every card an image. Icon locks are honoured first so random cards
 * don't repeat them; other cards keep what they show when it still fits their
 * lock, and the rest draw an unused image. An icon lock whose file is gone
 * behaves like an unlocked card.
 */
export function fillCards(
  cards: CustomCard[],
  current: Assignment,
  images: OrthodoxImage[],
  wallPool: OrthodoxImage[],
  random: Random = Math.random,
): Assignment {
  const next: Assignment = {};
  const used = new Set<string>();
  const open: CustomCard[] = [];

  for (const card of cards) {
    const image = lockedImage(card, images);
    if (image) {
      next[card.id] = image;
      used.add(image.id);
    } else {
      open.push(card);
    }
  }

  const unfilled: CustomCard[] = [];
  for (const card of open) {
    const shown = current[card.id];
    const fits =
      shown &&
      !used.has(shown.id) &&
      candidatesFor(card, images, wallPool).some((i) => i.id === shown.id);
    if (fits) {
      next[card.id] = shown;
      used.add(shown.id);
    } else {
      unfilled.push(card);
    }
  }

  for (const card of unfilled) {
    const image = pickOne(candidatesFor(card, images, wallPool), used, random);
    if (!image) continue;
    next[card.id] = image;
    used.add(image.id);
  }
  return next;
}

/**
 * Swap the image on one card that isn't locked to a specific icon. Returns
 * `current` unchanged when no card has anything new to show.
 */
export function rotateCard(
  cards: CustomCard[],
  current: Assignment,
  images: OrthodoxImage[],
  wallPool: OrthodoxImage[],
  random: Random = Math.random,
): Assignment {
  const used = new Set(Object.values(current).map((image) => image.id));
  const options = cards
    .filter((card) => !lockedImage(card, images))
    .map((card) => ({
      card,
      fresh: candidatesFor(card, images, wallPool).filter(
        (image) => !used.has(image.id),
      ),
    }))
    .filter(({ fresh }) => fresh.length > 0);
  if (options.length === 0) return current;
  const { card, fresh } = options[Math.floor(random() * options.length)];
  return { ...current, [card.id]: fresh[Math.floor(random() * fresh.length)] };
}

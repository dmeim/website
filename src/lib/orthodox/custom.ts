import { z } from "zod";

import { BOARD_ASPECT } from "./layout";
import type { Box, OrthodoxCollection, OrthodoxImage, Size } from "./types";

/** Custom cards snap to a GRID × GRID lattice laid over the whole wall. */
export const GRID = 48;
export const MIN_SPAN = 3;
export const MAX_CARDS = 24;

const NEW_CARD_SPAN = 8;
/** Breathing room, in grid steps, around a newly added card. */
const NEW_CARD_GAP = 1;

export type CardLock =
  | { kind: "any" }
  | { kind: "collection"; collection: string }
  | { kind: "icon"; imageId: string };

/**
 * Position and size are in grid steps rather than pixels, so a wall built on
 * one screen keeps its proportions on another.
 */
export type CustomCard = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  lock: CardLock;
};

const ANY: CardLock = { kind: "any" };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(value), min), max);
}

export function clampCard(card: CustomCard): CustomCard {
  const w = clamp(card.w, MIN_SPAN, GRID);
  const h = clamp(card.h, MIN_SPAN, GRID);
  return {
    ...card,
    w,
    h,
    x: clamp(card.x, 0, GRID - w),
    y: clamp(card.y, 0, GRID - h),
  };
}

export function moveCard(card: CustomCard, dx: number, dy: number): CustomCard {
  return clampCard({ ...card, x: card.x + dx, y: card.y + dy });
}

/** Grow or shrink from the bottom-right corner; the top-left stays put. */
export function resizeCard(
  card: CustomCard,
  dw: number,
  dh: number,
): CustomCard {
  return {
    ...card,
    w: clamp(card.w + dw, MIN_SPAN, GRID - card.x),
    h: clamp(card.h + dh, MIN_SPAN, GRID - card.y),
  };
}

export function sameGeometry(a: CustomCard, b: CustomCard): boolean {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}

export function cardBox(card: CustomCard, size: Size): Box {
  const sx = size.width / GRID;
  const sy = size.height / GRID;
  return {
    x: Math.round(card.x * sx),
    y: Math.round(card.y * sy),
    w: Math.round(card.w * sx),
    h: Math.round(card.h * sy),
  };
}

export function newCardId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Snap pixel boxes (e.g. the current preset layout) onto the grid. */
export function cardsFromBoxes(
  boxes: Box[],
  size: Size,
  makeId: () => string = newCardId,
): CustomCard[] {
  if (size.width <= 0 || size.height <= 0) return [];
  const sx = GRID / size.width;
  const sy = GRID / size.height;
  return boxes.slice(0, MAX_CARDS).map((box) =>
    clampCard({
      id: makeId(),
      x: box.x * sx,
      y: box.y * sy,
      w: box.w * sx,
      h: box.h * sy,
      lock: ANY,
    }),
  );
}

function overlaps(a: CustomCard, b: CustomCard, gap = 0): boolean {
  return (
    a.x < b.x + b.w + gap &&
    b.x < a.x + a.w + gap &&
    a.y < b.y + b.h + gap &&
    b.y < a.y + a.h + gap
  );
}

/**
 * A portrait card in the first free spot (top-left first, clear of the edges
 * and other cards); centred on top of the others when the wall is full.
 */
export function addCard(
  cards: CustomCard[],
  size: Size,
  id: string = newCardId(),
): CustomCard {
  const w = NEW_CARD_SPAN;
  const ratio =
    size.width > 0 && size.height > 0 ? size.width / size.height : 1;
  const h = clamp(w * ratio * BOARD_ASPECT, MIN_SPAN, GRID);
  const candidate = (x: number, y: number) =>
    clampCard({ id, x, y, w, h, lock: ANY });

  const g = NEW_CARD_GAP;
  for (let y = g; y + h + g <= GRID; y += 1) {
    for (let x = g; x + w + g <= GRID; x += 1) {
      const card = candidate(x, y);
      if (!cards.some((other) => overlaps(card, other, g))) return card;
    }
  }
  return candidate((GRID - w) / 2, (GRID - h) / 2);
}

const lockSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("any") }),
  z.object({ kind: z.literal("collection"), collection: z.string().min(1) }),
  z.object({ kind: z.literal("icon"), imageId: z.string().min(1) }),
]);

const cardSchema = z.object({
  id: z.string().min(1),
  x: z.number().finite(),
  y: z.number().finite(),
  w: z.number().finite(),
  h: z.number().finite(),
  lock: lockSchema.catch(ANY),
});

/**
 * Keep every stored card that still parses. A lock on a collection that no
 * longer exists falls back to "any"; icon locks are kept even when the file
 * is gone so re-adding it restores the card.
 */
export function parseCards(
  raw: unknown,
  collectionIds: string[],
): CustomCard[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const cards: CustomCard[] = [];
  for (const item of raw) {
    const result = cardSchema.safeParse(item);
    if (!result.success || seen.has(result.data.id)) continue;
    seen.add(result.data.id);
    const { lock } = result.data;
    const staleCollection =
      lock.kind === "collection" && !collectionIds.includes(lock.collection);
    cards.push(
      clampCard({ ...result.data, lock: staleCollection ? ANY : lock }),
    );
  }
  return cards.slice(0, MAX_CARDS);
}

/** Short text for a card's lock chip; `missing` flags an icon whose file is gone. */
export function describeLock(
  lock: CardLock,
  images: OrthodoxImage[],
  collections: OrthodoxCollection[],
): { text: string; missing: boolean } {
  if (lock.kind === "collection") {
    const found = collections.find((c) => c.id === lock.collection);
    return { text: found?.label ?? lock.collection, missing: false };
  }
  if (lock.kind === "icon") {
    const found = images.find((image) => image.id === lock.imageId);
    return found
      ? { text: found.title, missing: false }
      : { text: "Missing icon", missing: true };
  }
  return { text: "Any icon", missing: false };
}

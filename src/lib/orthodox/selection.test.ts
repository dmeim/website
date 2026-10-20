import { describe, expect, it } from "vitest";

import type { CustomCard } from "./custom";
import {
  ALL_COLLECTIONS,
  fillCards,
  pickImages,
  poolFor,
  resizeSelection,
  rotateCard,
  rotateOne,
} from "./selection";
import type { OrthodoxImage } from "./types";

function image(collection: string, n: number): OrthodoxImage {
  return {
    id: `${collection}/${n}`,
    src: `/${collection}/${n}.jpg`,
    thumb: `/${collection}/${n}.thumb.jpg`,
    title: `${n}`,
    collection,
  };
}

const saints = [1, 2, 3].map((n) => image("saints", n));
const feasts = [1, 2].map((n) => image("feasts", n));
const all = [...saints, ...feasts];

describe("poolFor", () => {
  it("returns every image for 'all'", () => {
    expect(poolFor(all, ALL_COLLECTIONS)).toEqual(all);
  });

  it("filters by collection", () => {
    expect(poolFor(all, "feasts")).toEqual(feasts);
  });
});

describe("pickImages", () => {
  it("picks distinct images", () => {
    const picked = pickImages(all, 4);
    expect(new Set(picked.map((i) => i.id)).size).toBe(4);
  });

  it("caps at the pool size", () => {
    expect(pickImages(feasts, 10)).toHaveLength(2);
  });
});

describe("resizeSelection", () => {
  it("keeps hanging images when growing", () => {
    const current = saints.slice(0, 2);
    const next = resizeSelection(current, all, 4);
    expect(next.slice(0, 2)).toEqual(current);
    expect(new Set(next.map((i) => i.id)).size).toBe(4);
  });

  it("trims from the end when shrinking", () => {
    expect(resizeSelection(saints, saints, 1)).toEqual([saints[0]]);
  });

  it("drops images outside a new collection", () => {
    const next = resizeSelection(saints, feasts, 2);
    expect(next.every((i) => i.collection === "feasts")).toBe(true);
    expect(next).toHaveLength(2);
  });
});

describe("rotateOne", () => {
  it("swaps exactly one slot for an unused image", () => {
    const current = saints.slice(0, 2);
    const next = rotateOne(current, saints, () => 0);
    expect(next).toHaveLength(2);
    expect(next[0].id).toBe("saints/3");
    expect(next[1]).toBe(current[1]);
  });

  it("holds when every image is already shown", () => {
    expect(rotateOne(feasts, feasts)).toBe(feasts);
  });
});

function slot(
  id: string,
  lock: CustomCard["lock"] = { kind: "any" },
): CustomCard {
  return { id, x: 0, y: 0, w: 8, h: 12, lock };
}

describe("fillCards", () => {
  it("honours icon and group locks and avoids repeating a locked icon", () => {
    const cards = [
      slot("pinned", { kind: "icon", imageId: "saints/2" }),
      slot("group", { kind: "collection", collection: "feasts" }),
      slot("free1"),
      slot("free2"),
    ];
    for (let seed = 0; seed < 20; seed += 1) {
      const filled = fillCards(cards, {}, all, saints, () => (seed % 10) / 10);
      expect(filled.pinned.id).toBe("saints/2");
      expect(filled.group.collection).toBe("feasts");
      expect([filled.free1.id, filled.free2.id]).not.toContain("saints/2");
      expect(filled.free1.id).not.toBe(filled.free2.id);
    }
  });

  it("keeps what a card shows while it still fits", () => {
    const cards = [slot("a"), slot("b")];
    const current = { a: saints[2], b: saints[0] };
    expect(fillCards(cards, current, all, saints)).toEqual(current);
  });

  it("redraws a card whose image no longer fits its lock", () => {
    const cards = [slot("a", { kind: "collection", collection: "feasts" })];
    const filled = fillCards(cards, { a: saints[0] }, all, saints);
    expect(filled.a.collection).toBe("feasts");
  });

  it("treats an icon lock on a missing file as unlocked", () => {
    const cards = [slot("a", { kind: "icon", imageId: "saints/99" })];
    expect(fillCards(cards, {}, all, saints).a.collection).toBe("saints");
  });

  it("repeats images only when a card's pool runs out", () => {
    const cards = [1, 2, 3].map((n) =>
      slot(`${n}`, { kind: "collection", collection: "feasts" }),
    );
    const filled = fillCards(cards, {}, all, saints);
    expect(Object.keys(filled)).toHaveLength(3);
  });
});

describe("rotateCard", () => {
  it("never changes an icon-locked card", () => {
    const cards = [
      slot("pinned", { kind: "icon", imageId: "saints/1" }),
      slot("free"),
    ];
    const current = { pinned: saints[0], free: saints[1] };
    for (let i = 0; i < 10; i += 1) {
      const next = rotateCard(cards, current, all, saints, () => i / 10);
      expect(next.pinned).toBe(saints[0]);
      expect(next.free.id).toBe("saints/3");
    }
  });

  it("returns the same object when nothing is left to show", () => {
    const cards = [slot("a"), slot("b"), slot("c")];
    const current = { a: saints[0], b: saints[1], c: saints[2] };
    expect(rotateCard(cards, current, all, saints)).toBe(current);
  });
});

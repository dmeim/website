import { describe, expect, it } from "vitest";

import {
  ALL_COLLECTIONS,
  pickImages,
  poolFor,
  resizeSelection,
  rotateOne,
} from "./selection";
import type { OrthodoxImage } from "./types";

function image(collection: string, n: number): OrthodoxImage {
  return {
    id: `${collection}/${n}`,
    src: `/${collection}/${n}.jpg`,
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

import { describe, expect, it } from "vitest";

import {
  GRID,
  MAX_CARDS,
  MIN_SPAN,
  addCard,
  cardBox,
  cardsFromBoxes,
  describeLock,
  moveCard,
  parseCards,
  resizeCard,
  type CustomCard,
} from "./custom";

function card(patch: Partial<CustomCard> = {}): CustomCard {
  return { id: "a", x: 4, y: 4, w: 8, h: 12, lock: { kind: "any" }, ...patch };
}

const wall = { width: 1920, height: 1080 };

describe("moveCard", () => {
  it("keeps the card on the wall", () => {
    expect(moveCard(card(), -10, -10)).toMatchObject({ x: 0, y: 0 });
    expect(moveCard(card(), 100, 100)).toMatchObject({
      x: GRID - 8,
      y: GRID - 12,
    });
  });
});

describe("resizeCard", () => {
  it("grows from the bottom-right without moving the origin", () => {
    expect(resizeCard(card(), 3, 2)).toMatchObject({
      x: 4,
      y: 4,
      w: 11,
      h: 14,
    });
  });

  it("stops at the wall edge and at the minimum size", () => {
    expect(resizeCard(card(), 100, 100)).toMatchObject({
      w: GRID - 4,
      h: GRID - 4,
    });
    expect(resizeCard(card(), -100, -100)).toMatchObject({
      w: MIN_SPAN,
      h: MIN_SPAN,
    });
  });
});

describe("cardBox / cardsFromBoxes", () => {
  it("round-trips a grid-aligned box", () => {
    const original = card({ x: 6, y: 12, w: 12, h: 24 });
    const [back] = cardsFromBoxes([cardBox(original, wall)], wall, () => "a");
    expect(back).toEqual(original);
  });

  it("returns nothing before the wall is measured", () => {
    expect(
      cardsFromBoxes([{ x: 0, y: 0, w: 10, h: 10 }], { width: 0, height: 0 }),
    ).toEqual([]);
  });
});

describe("addCard", () => {
  it("places the first card top-left as a portrait panel", () => {
    const first = addCard([], wall, "new");
    expect(first).toMatchObject({ id: "new", x: 1, y: 1 });
    const box = cardBox(first, wall);
    expect(box.h / box.w).toBeCloseTo(4 / 3, 0);
  });

  it("finds a free spot next to existing cards", () => {
    const first = addCard([], wall, "1");
    const second = addCard([first], wall, "2");
    expect(second.x).toBe(first.x + first.w + 1);
    expect(second.y).toBe(1);
  });
});

describe("parseCards", () => {
  it("ignores non-arrays, invalid entries and duplicate ids", () => {
    expect(parseCards("nope", [])).toEqual([]);
    const parsed = parseCards(
      [
        card(),
        card(),
        { id: "b" },
        card({ id: "c", lock: { kind: "bogus" } as never }),
      ],
      [],
    );
    expect(parsed.map((c) => [c.id, c.lock.kind])).toEqual([
      ["a", "any"],
      ["c", "any"],
    ]);
  });

  it("clamps out-of-range geometry and caps the count", () => {
    const [clamped] = parseCards([card({ x: -5, w: 500 })], []);
    expect(clamped).toMatchObject({ x: 0, w: GRID });
    const many = Array.from({ length: 40 }, (_, i) => card({ id: `${i}` }));
    expect(parseCards(many, [])).toHaveLength(MAX_CARDS);
  });
});

describe("describeLock", () => {
  const images = [
    {
      id: "December/St_Nicholas",
      src: "",
      thumb: "",
      title: "St Nicholas",
      collection: "December",
    },
  ];
  const collections = [{ id: "December", label: "December", count: 1 }];

  it("names the group, the icon, or a missing file", () => {
    expect(describeLock({ kind: "any" }, images, collections).text).toBe(
      "Any icon",
    );
    expect(
      describeLock(
        { kind: "collection", collection: "December" },
        images,
        collections,
      ).text,
    ).toBe("December");
    expect(
      describeLock(
        { kind: "icon", imageId: "December/St_Nicholas" },
        images,
        collections,
      ),
    ).toEqual({ text: "St Nicholas", missing: false });
    expect(
      describeLock({ kind: "icon", imageId: "May/gone" }, images, collections),
    ).toEqual({ text: "Missing icon", missing: true });
  });
});

import { describe, expect, it } from "vitest";

import { defaultSettings, formatRotation, parseSettings } from "./settings";

const known = {
  collectionIds: ["saints", "feasts"],
  backgroundIds: ["limewash", "ochre"],
};

describe("parseSettings", () => {
  it("falls back to defaults for non-objects", () => {
    expect(parseSettings(null, known)).toEqual(
      defaultSettings(known.backgroundIds),
    );
    expect(parseSettings("nope", known).background).toBe("limewash");
  });

  it("keeps valid fields and drops stale ones individually", () => {
    const parsed = parseSettings(
      {
        count: 8,
        collection: "removed-collection",
        layout: "grid",
        border: "gold",
        rotationSeconds: 7,
        background: "ochre",
      },
      known,
    );
    expect(parsed).toEqual({
      count: 8,
      collection: "all",
      layout: "grid",
      border: "gold",
      rotationSeconds: 60,
      background: "ochre",
      customCards: [],
    });
  });

  it("keeps custom cards and drops locks on removed collections", () => {
    const parsed = parseSettings(
      {
        layout: "custom",
        customCards: [
          {
            id: "a",
            x: 1,
            y: 2,
            w: 8,
            h: 12,
            lock: { kind: "collection", collection: "feasts" },
          },
          {
            id: "b",
            x: 0,
            y: 0,
            w: 8,
            h: 12,
            lock: { kind: "collection", collection: "gone" },
          },
          {
            id: "c",
            x: 0,
            y: 0,
            w: 8,
            h: 12,
            lock: { kind: "icon", imageId: "saints/missing" },
          },
          { id: "d", x: "left" },
        ],
      },
      known,
    );
    expect(parsed.layout).toBe("custom");
    expect(parsed.customCards.map((card) => card.lock)).toEqual([
      { kind: "collection", collection: "feasts" },
      { kind: "any" },
      { kind: "icon", imageId: "saints/missing" },
    ]);
  });

  it("rejects out-of-range counts", () => {
    expect(parseSettings({ count: 40 }, known).count).toBe(5);
    expect(parseSettings({ count: 2.5 }, known).count).toBe(5);
  });
});

describe("formatRotation", () => {
  it("labels the interval", () => {
    expect(formatRotation(0)).toBe("Off");
    expect(formatRotation(30)).toBe("30s");
    expect(formatRotation(300)).toBe("5 min");
  });
});

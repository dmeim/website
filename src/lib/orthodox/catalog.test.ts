import { describe, expect, it } from "vitest";

import { collectionsFrom, imagesFromGlob, titleFromFilename } from "./catalog";

describe("titleFromFilename", () => {
  it("drops ordering prefixes and extensions", () => {
    expect(titleFromFilename("01-st-nicholas_of-myra.jpg")).toBe(
      "St Nicholas Of Myra",
    );
    expect(titleFromFilename("theotokos.webp")).toBe("Theotokos");
  });
});

describe("imagesFromGlob", () => {
  it("derives collection and id from the folder layout", () => {
    const images = imagesFromGlob({
      "/src/assets/orthodox/icons/saints/02-st-george.jpg": "/_astro/b.jpg",
      "/src/assets/orthodox/icons/feasts/nativity.png": "/_astro/a.png",
    });
    expect(images).toEqual([
      {
        id: "feasts/nativity",
        src: "/_astro/a.png",
        title: "Nativity",
        collection: "feasts",
      },
      {
        id: "saints/02-st-george",
        src: "/_astro/b.jpg",
        title: "St George",
        collection: "saints",
      },
    ]);
  });
});

describe("collectionsFrom", () => {
  it("counts images and applies label overrides", () => {
    const images = imagesFromGlob({
      "/x/saints/a.jpg": "a",
      "/x/saints/b.jpg": "b",
      "/x/great-feasts/c.jpg": "c",
    });
    expect(collectionsFrom(images, { saints: "Holy Saints" })).toEqual([
      { id: "great-feasts", count: 1, label: "Great Feasts" },
      { id: "saints", count: 2, label: "Holy Saints" },
    ]);
  });

  it("puts ordered collections first, then the rest alphabetically", () => {
    const images = imagesFromGlob({
      "/x/December/a.jpg": "a",
      "/x/zebra/b.jpg": "b",
      "/x/April/c.jpg": "c",
      "/x/apples/d.jpg": "d",
    });
    const ids = collectionsFrom(images, {}, ["April", "December"]).map(
      (collection) => collection.id,
    );
    expect(ids).toEqual(["April", "December", "apples", "zebra"]);
  });
});

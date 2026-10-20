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

function urls(src: string) {
  return { src, thumb: `${src}?thumb` };
}

describe("imagesFromGlob", () => {
  it("derives collection and id from the folder layout", () => {
    const images = imagesFromGlob({
      "/src/assets/orthodox/icons/saints/02-st-george.jpg":
        urls("/_astro/b.jpg"),
      "/src/assets/orthodox/icons/feasts/nativity.png": urls("/_astro/a.png"),
    });
    expect(images).toEqual([
      {
        id: "feasts/nativity",
        src: "/_astro/a.png",
        thumb: "/_astro/a.png?thumb",
        title: "Nativity",
        collection: "feasts",
      },
      {
        id: "saints/02-st-george",
        src: "/_astro/b.jpg",
        thumb: "/_astro/b.jpg?thumb",
        title: "St George",
        collection: "saints",
      },
    ]);
  });
});

describe("collectionsFrom", () => {
  it("counts images and applies label overrides", () => {
    const images = imagesFromGlob({
      "/x/saints/a.jpg": urls("a"),
      "/x/saints/b.jpg": urls("b"),
      "/x/great-feasts/c.jpg": urls("c"),
    });
    expect(collectionsFrom(images, { saints: "Holy Saints" })).toEqual([
      { id: "great-feasts", count: 1, label: "Great Feasts" },
      { id: "saints", count: 2, label: "Holy Saints" },
    ]);
  });

  it("puts ordered collections first, then the rest alphabetically", () => {
    const images = imagesFromGlob({
      "/x/December/a.jpg": urls("a"),
      "/x/zebra/b.jpg": urls("b"),
      "/x/April/c.jpg": urls("c"),
      "/x/apples/d.jpg": urls("d"),
    });
    const ids = collectionsFrom(images, {}, ["April", "December"]).map(
      (collection) => collection.id,
    );
    expect(ids).toEqual(["April", "December", "apples", "zebra"]);
  });
});

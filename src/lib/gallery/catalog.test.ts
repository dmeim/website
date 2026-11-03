import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { ALL_EXTENSIONS, albumsFromFiles, kindOf, mimeOf, relativeTo } from "./catalog";
import type { GalleryFile } from "./types";

function still(name: string, animated = false): GalleryFile {
  const src = `/_astro/${name}`;
  return { kind: "image", original: src, animated, src, thumb: `${src}?thumb`, width: 800, height: 600 };
}

function playable(kind: "video" | "audio", name: string): GalleryFile {
  return { kind, original: `/_astro/${name}`, mime: mimeOf(name) };
}

const entries: Record<string, GalleryFile> = {
  "wallpapers/10-dunes.jpg": still("dunes.jpg"),
  "wallpapers/2-forest.jpg": still("forest.jpg"),
  "wallpapers/coast.png": still("coast.png"),
  "city-nights/neon.jpg": still("neon.jpg"),
};

describe("kindOf / mimeOf", () => {
  it("classifies by extension, case-insensitively", () => {
    expect(kindOf("a/b.GIF")).toBe("image");
    expect(kindOf("a/b.webm")).toBe("video");
    expect(kindOf("a/b.flac")).toBe("audio");
    expect(kindOf("a/b.txt")).toBeUndefined();
    expect(mimeOf("clip.MOV")).toBe("video/quicktime");
    expect(mimeOf("song.m4a")).toBe("audio/mp4");
  });

  it("matches the literal globs in gallery/assets.ts", () => {
    const source = fs.readFileSync(path.join(__dirname, "assets.ts"), "utf8");
    const pattern = /"\/src\/assets\/gallery\/\*\*\/\*\.\{([^}]+)\}"/g;
    const globs = [...source.matchAll(pattern)].map((m) => m[1].split(","));
    expect(globs).toHaveLength(2);
    expect(globs[0]).toEqual(ALL_EXTENSIONS.filter((ext) => kindOf(`x.${ext}`) === "image"));
    expect(globs[1]).toEqual(ALL_EXTENSIONS);
  });
});

describe("albumsFromFiles", () => {
  it("groups by folder and falls back to file-derived titles", () => {
    const albums = albumsFromFiles(entries, {});
    expect(albums.map((album) => album.slug)).toEqual(["city-nights", "wallpapers"]);
    expect(albums[0]).toMatchObject({ title: "City Nights", description: "" });
    const wallpapers = albums[1];
    // Numeric-aware: 2 before 10; ordering prefixes stay out of titles.
    expect(wallpapers.items.map((item) => item.id)).toEqual(["2-forest", "10-dunes", "coast"]);
    expect(wallpapers.items[0]).toMatchObject({ kind: "image", title: "Forest", alt: "Forest", description: "" });
    expect(wallpapers.cover.id).toBe("2-forest");
    expect(wallpapers).toMatchObject({ sections: [], download: true });
  });

  it("applies metadata order, words and cover", () => {
    const [album] = albumsFromFiles(
      entries,
      {
        wallpapers: {
          title: "Walls",
          description: "Desktop backgrounds.",
          cover: "coast",
          items: { coast: { title: "The Coast", description: "Low tide." }, "10-dunes": {} },
        },
      },
      ["wallpapers"],
    );
    expect(album).toMatchObject({ slug: "wallpapers", title: "Walls", description: "Desktop backgrounds." });
    expect(album.items.map((item) => item.id)).toEqual(["coast", "10-dunes", "2-forest"]);
    expect(album.items[0]).toMatchObject({ title: "The Coast", description: "Low tide.", alt: "The Coast" });
    expect(album.cover.id).toBe("coast");
  });

  it("pairs same-named stills with video and audio as posters and covers", () => {
    const [album] = albumsFromFiles(
      {
        "mixed/clip.mp4": playable("video", "clip.mp4"),
        "mixed/clip.jpg": still("clip.jpg"),
        "mixed/song.mp3": playable("audio", "song.mp3"),
        "mixed/loop.gif": still("loop.gif", true),
      },
      {},
    );
    expect(album.items.map((item) => [item.id, item.kind])).toEqual([
      ["clip", "video"],
      ["loop", "image"],
      ["song", "audio"],
    ]);
    const [clip, loop, song] = album.items;
    expect(clip).toMatchObject({ media: { src: "/_astro/clip.mp4", mime: "video/mp4" }, original: "/_astro/clip.mp4" });
    expect(clip.still?.thumb).toBe("/_astro/clip.jpg?thumb");
    expect(loop.animated).toBe(true);
    expect(song.still).toBeUndefined();
    expect(song.media?.mime).toBe("audio/mpeg");
  });

  it("fails loudly on metadata that names nothing on disk, or on clashing stems", () => {
    expect(() => albumsFromFiles(entries, { missing: {} })).toThrow(/album "missing"/);
    expect(() => albumsFromFiles(entries, { wallpapers: { items: { nope: {} } } })).toThrow(/"nope"/);
    expect(() => albumsFromFiles(entries, { wallpapers: { cover: "nope" } })).toThrow(/cover "nope"/);
    expect(() =>
      albumsFromFiles(
        { "a/x.mp4": playable("video", "x.mp4"), "a/x.mp3": playable("audio", "x.mp3") },
        {},
      ),
    ).toThrow(/two media files named "x"/);
  });

  it("turns sub-folders into ordered sections with prefixed ids", () => {
    const [album] = albumsFromFiles(
      {
        "icons/May/b.jpg": still("b.jpg"),
        "icons/April/St_George.jpg": still("george.jpg"),
        "icons/Extra/z.jpg": still("z.jpg"),
        "icons/loose.jpg": still("loose.jpg"),
      },
      {
        icons: {
          sections: ["January", "April", "May"],
          sectionLabels: { Extra: "Other" },
          items: { "April/St_George": { description: "Dragon." } },
          download: false,
        },
      },
    );
    expect(album.sections).toEqual([
      { id: "April", label: "April" },
      { id: "May", label: "May" },
      { id: "Extra", label: "Other" },
    ]);
    expect(album.items.map((item) => [item.id, item.section])).toEqual([
      ["loose", undefined],
      ["April/St_George", "April"],
      ["May/b", "May"],
      ["Extra/z", "Extra"],
    ]);
    expect(album.items[1]).toMatchObject({ title: "St George", description: "Dragon." });
    expect(album.download).toBe(false);
  });

  it("rejects files outside an album or nested too deep", () => {
    expect(() => albumsFromFiles({ "x.jpg": still("x.jpg") }, {})).toThrow(/must sit in/);
    expect(() => albumsFromFiles({ "a/b/c/x.jpg": still("x.jpg") }, {})).toThrow(/must sit in/);
  });
});

describe("relativeTo", () => {
  it("strips the root and fails on paths outside it", () => {
    expect(relativeTo("/src/assets/gallery/", { "/src/assets/gallery/a/x.jpg": 1 })).toEqual({ "a/x.jpg": 1 });
    expect(() => relativeTo("/src/assets/gallery/", { "/elsewhere/x.jpg": 1 })).toThrow(/outside/);
  });
});

import { describe, expect, it } from "vitest";

import type { GalleryFile } from "../gallery/types";
import { compareProjects, projectAlbums, type ProjectMediaSource } from "./catalog";

function still(name: string): GalleryFile {
  const src = `/_astro/${name}`;
  return { kind: "image", original: src, animated: false, src, thumb: src, width: 1440, height: 900 };
}

function project(slug: string, extra: Partial<ProjectMediaSource> = {}): ProjectMediaSource {
  return { slug, title: slug.toUpperCase(), summary: `About ${slug}`, media: {}, ...extra };
}

const files: Record<string, GalleryFile> = {
  "site/home.png": still("home.png"),
  "site/tools.png": still("tools.png"),
};

describe("projectAlbums", () => {
  it("builds albums only for projects with a media folder", () => {
    const albums = projectAlbums(files, [
      project("site", { cover: "tools", media: { tools: { title: "Tools" } } }),
      project("idea"),
    ]);
    expect([...albums.keys()]).toEqual(["site"]);
    const album = albums.get("site")!;
    expect(album).toMatchObject({ title: "SITE", description: "About site" });
    expect(album.cover.id).toBe("tools");
    expect(album.items.map((item) => [item.id, item.title])).toEqual([
      ["tools", "Tools"],
      ["home", "Home"],
    ]);
  });

  it("fails on a media folder without a project", () => {
    expect(() => projectAlbums(files, [project("other")])).toThrow(/media folder "site" has no/);
  });

  it("fails on media words for a project without a folder", () => {
    expect(() =>
      projectAlbums(files, [project("site"), project("idea", { media: { shot: {} } })]),
    ).toThrow(/"idea" names media/);
    expect(() => projectAlbums(files, [project("site"), project("idea", { cover: "shot" })])).toThrow(
      /"idea" names media/,
    );
  });
});

describe("compareProjects", () => {
  it("orders by `order`, then title, with unordered last", () => {
    const list = [
      { title: "Zed" },
      { title: "Beta", order: 2 },
      { title: "Alpha" },
      { title: "Gamma", order: 1 },
    ].sort(compareProjects);
    expect(list.map((p) => p.title)).toEqual(["Gamma", "Beta", "Alpha", "Zed"]);
  });
});

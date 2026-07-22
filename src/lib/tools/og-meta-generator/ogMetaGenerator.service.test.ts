import { describe, expect, it } from "vitest";

import {
  buildMetaStrings,
  buildOgMetaTags,
  clearTypeSchemaKeys,
  DEFAULT_OG_METADATA,
  flattenMetadata,
  generateMeta,
  getActiveSections,
  toSnakeCase,
} from "./ogMetaGenerator.service";

describe("og-meta-generator", () => {
  describe("toSnakeCase", () => {
    it("snake_cases camelCase and preserves colon segments", () => {
      expect(toSnakeCase("weirdCaseURLStuff")).toBe("weird_case_url_stuff");
      expect(toSnakeCase("image:alt")).toBe("image:alt");
      expect(toSnakeCase("publishedTime")).toBe("published_time");
    });
  });

  describe("flattenMetadata", () => {
    it("flattens nested objects and arrays", () => {
      expect(
        flattenMetadata({
          title: "it-tools",
          author: { name: "Corentin", age: "42" },
          tags: ["foo", "bar"],
          directors: [
            { name: "Aimie", age: "43" },
            { name: "Pocky", age: "44" },
          ],
        }),
      ).toEqual([
        { key: "title", value: "it-tools" },
        { key: "author:name", value: "Corentin" },
        { key: "author:age", value: "42" },
        { key: "tags", value: "foo" },
        { key: "tags", value: "bar" },
        { key: "directors:name", value: "Aimie" },
        { key: "directors:age", value: "43" },
        { key: "directors:name", value: "Pocky" },
        { key: "directors:age", value: "44" },
      ]);
    });

    it("skips empty strings and undefined roots", () => {
      expect(flattenMetadata(undefined)).toEqual([]);
      expect(flattenMetadata({ title: "" })).toEqual([]);
      expect(flattenMetadata({ title: "ok", blank: "" })).toEqual([
        { key: "title", value: "ok" },
      ]);
    });

    it("applies an og base prefix", () => {
      expect(flattenMetadata({ title: "Hello", "image:alt": "Alt" }, { basePrefix: "og" })).toEqual([
        { key: "og:title", value: "Hello" },
        { key: "og:image:alt", value: "Alt" },
      ]);
    });
  });

  describe("buildMetaStrings", () => {
    it("emits property meta tags", () => {
      expect(
        buildMetaStrings({
          flatMetadata: [
            { key: "og:title", value: "it-tools" },
            { key: "og:description", value: "Lorem ipsum" },
          ],
          type: "property",
        }),
      ).toEqual([
        '<meta property="og:title" content="it-tools" />',
        '<meta property="og:description" content="Lorem ipsum" />',
      ]);
    });
  });

  describe("generateMeta", () => {
    it("generates og meta strings", () => {
      expect(
        generateMeta({ title: "it-tools", description: "A website with tools" }),
      ).toBe(
        [
          "<!-- og meta -->",
          '<meta property="og:title" content="it-tools" />',
          '<meta property="og:description" content="A website with tools" />',
        ].join("\n"),
      );
    });

    it("omits empty string values", () => {
      expect(generateMeta({ title: "" })).toBe("");
    });

    it("handles array of values", () => {
      expect(generateMeta({ movie: { author: ["Jane Mi", "John Do"] } })).toBe(
        [
          "<!-- og meta -->",
          '<meta property="og:movie:author" content="Jane Mi" />',
          '<meta property="og:movie:author" content="John Do" />',
        ].join("\n"),
      );
    });

    it("adds twitter-compatible tags when requested", () => {
      expect(
        generateMeta(
          {
            title: "it-tools",
            description: "Lorem ipsum",
            twitter: { title: "it-tools twitter" },
          },
          { generateTwitterCompatibleMeta: true },
        ),
      ).toBe(
        [
          "<!-- og meta -->",
          '<meta property="og:title" content="it-tools" />',
          '<meta property="og:description" content="Lorem ipsum" />',
          "",
          "<!-- twitter meta -->",
          '<meta name="twitter:title" content="it-tools twitter" />',
          '<meta name="twitter:description" content="Lorem ipsum" />',
        ].join("\n"),
      );
    });

    it("supports indentation", () => {
      expect(
        generateMeta(
          {
            title: "it-tools",
            description: "A website with tools",
            weirdCaseURLStuff: true,
          },
          {
            indentation: 3,
            indentWith: " ",
            generateTwitterCompatibleMeta: true,
          },
        ),
      ).toBe(
        [
          "   <!-- og meta -->",
          '   <meta property="og:title" content="it-tools" />',
          '   <meta property="og:description" content="A website with tools" />',
          '   <meta property="og:weird_case_url_stuff" content="true" />',
          "",
          "   <!-- twitter meta -->",
          '   <meta name="twitter:title" content="it-tools" />',
          '   <meta name="twitter:description" content="A website with tools" />',
        ].join("\n"),
      );
    });
  });

  describe("buildOgMetaTags", () => {
    it("splits twitter keys and mirrors defaults", () => {
      const html = buildOgMetaTags({
        ...DEFAULT_OG_METADATA,
        title: "Demo",
        description: "Hello",
        url: "https://example.com",
        image: "https://example.com/og.png",
        "image:alt": "Cover",
      });

      expect(html).toContain('property="og:type" content="website"');
      expect(html).toContain('property="og:title" content="Demo"');
      expect(html).toContain('property="og:image" content="https://example.com/og.png"');
      expect(html).toContain('property="og:image:alt" content="Cover"');
      expect(html).toContain('name="twitter:card" content="summary_large_image"');
      expect(html).toContain('name="twitter:title" content="Demo"');
      expect(html).toContain('name="twitter:description" content="Hello"');
      expect(html).toContain('name="twitter:image" content="https://example.com/og.png"');
      expect(html).toContain('name="twitter:image:alt" content="Cover"');
    });

    it("emits repeated tags for multi-value fields", () => {
      const html = buildOgMetaTags({
        type: "video.movie",
        "video:actor": ["Alice", "Bob"],
      });
      expect(html).toContain('property="og:video:actor" content="Alice"');
      expect(html).toContain('property="og:video:actor" content="Bob"');
    });
  });

  describe("getActiveSections / clearTypeSchemaKeys", () => {
    it("includes type-specific section when present", () => {
      const websiteSections = getActiveSections("website");
      expect(websiteSections.map((s) => s.name)).toEqual([
        "General information",
        "Image",
        "Twitter",
      ]);

      const articleSections = getActiveSections("article");
      expect(articleSections.map((s) => s.name)).toEqual([
        "General information",
        "Image",
        "Twitter",
        "Article",
      ]);
    });

    it("clears previous type-specific keys", () => {
      const cleared = clearTypeSchemaKeys(
        {
          type: "website",
          "article:author": "Jane",
          "article:section": "Tech",
          title: "Keep me",
        },
        "article",
      );
      expect(cleared["article:author"]).toBe("");
      expect(cleared["article:section"]).toBe("");
      expect(cleared.title).toBe("Keep me");
    });
  });
});

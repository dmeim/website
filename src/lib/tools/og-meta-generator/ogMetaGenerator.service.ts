/**
 * Open Graph / social meta tag generator.
 * Native string templating — parity with it-tools meta-tag-generator + @it-tools/oggen.
 */

import { image, ogSchemas, twitter, website } from "./schemas";
import type {
  GenerateMetaOptions,
  MetadataFlat,
  MetaFieldValue,
  OGSchemaType,
  OgFormMetadata,
} from "./types";

export const DEFAULT_OG_METADATA: OgFormMetadata = {
  type: "website",
  "twitter:card": "summary_large_image",
};

const TWITTER_COMPATIBILITY: Record<string, string> = {
  "og:description": "twitter:description",
  "og:title": "twitter:title",
  "og:image": "twitter:image",
  "og:image:url": "twitter:image",
  "og:image:alt": "twitter:image:alt",
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return (
    typeof v === "object" &&
    !Array.isArray(v) &&
    v !== null &&
    !(v instanceof Date)
  );
}

function toSnakeCaseStrict(s: string): string {
  return (
    s
      .match(
        /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g,
      )
      ?.map((x) => x.toLowerCase())
      .join("_") ?? ""
  );
}

/** Preserve existing `:` segments while snake_casing each part (oggen parity). */
export function toSnakeCase(s: string): string {
  return s.split(":").map(toSnakeCaseStrict).join(":");
}

function stringifyValue(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

/**
 * Flatten nested metadata into `prefix:key` pairs.
 * Arrays emit one entry per item with the same key. Empty strings / undefined are skipped.
 */
export function flattenMetadata(
  metadata: unknown,
  {
    separator = ":",
    basePrefix = "",
  }: { separator?: string; basePrefix?: string } = {},
): MetadataFlat[] {
  const acc: MetadataFlat[] = [];

  const walk = (node: unknown, prefix = "") => {
    if (node === undefined || node === "") return;

    if (isPlainObject(node)) {
      for (const [key, value] of Object.entries(node)) {
        const prefixedKey = [prefix, toSnakeCase(key)].filter(Boolean).join(separator);
        walk(value, prefixedKey);
      }
    } else if (Array.isArray(node)) {
      for (const value of node) {
        walk(value, prefix);
      }
    } else {
      acc.push({ key: prefix, value: stringifyValue(node) });
    }
  };

  walk(metadata, basePrefix);
  return acc;
}

export function buildMetaStrings({
  flatMetadata,
  type,
}: {
  flatMetadata: MetadataFlat[];
  type: "property" | "name" | string;
}): string[] {
  return flatMetadata.map(
    ({ key, value }) => `<meta ${type}="${key}" content="${value}" />`,
  );
}

function pickTwitterCompatibleMetadata({
  existingMeta,
  twitterMeta,
}: {
  existingMeta: MetadataFlat[];
  twitterMeta: MetadataFlat[];
}): MetadataFlat[] {
  return existingMeta
    .filter(
      ({ key }) =>
        key in TWITTER_COMPATIBILITY &&
        twitterMeta.find((tm) => tm.key === TWITTER_COMPATIBILITY[key]) ===
          undefined,
    )
    .map(({ key, value }) => ({
      key: TWITTER_COMPATIBILITY[key] ?? key,
      value,
    }));
}

function generateMetaForType({
  title,
  flatMetadata,
  type,
}: {
  title: string;
  flatMetadata: MetadataFlat[];
  type: string;
}): string[] {
  if (flatMetadata.length === 0) return [];
  return [`<!-- ${title} -->`, ...buildMetaStrings({ flatMetadata, type })];
}

/**
 * Generate OG + optional Twitter meta HTML from a nested/flat config object.
 * Mirrors `@it-tools/oggen` `generateMeta`.
 */
export function generateMeta(
  {
    twitter: twitterMetadataRaw,
    ...ogMetadataRaw
  }: Record<string, unknown> & { twitter?: unknown },
  {
    indentation = 0,
    indentWith = "  ",
    generateTwitterCompatibleMeta = false,
  }: GenerateMetaOptions = {},
): string {
  const ogMetadataFlat = flattenMetadata(ogMetadataRaw, { basePrefix: "og" });
  const twitterMetadataFlat = flattenMetadata(twitterMetadataRaw, {
    basePrefix: "twitter",
  });

  const metaStringGroups = [
    generateMetaForType({
      title: "og meta",
      flatMetadata: ogMetadataFlat,
      type: "property",
    }),
    generateMetaForType({
      title: "twitter meta",
      flatMetadata: [
        ...twitterMetadataFlat,
        ...(generateTwitterCompatibleMeta
          ? pickTwitterCompatibleMetadata({
              existingMeta: ogMetadataFlat,
              twitterMeta: twitterMetadataFlat,
            })
          : []),
      ],
      type: "name",
    }),
  ];

  const metaGroups = metaStringGroups
    .filter((group) => group.length > 0)
    .map((group) =>
      group.map((str) => indentWith.repeat(indentation) + str).join("\n"),
    );

  return metaGroups.join("\n\n");
}

/** Sections shown for the current page type (general + image + twitter + type extras). */
export function getActiveSections(pageType: string): OGSchemaType[] {
  const secs: OGSchemaType[] = [website, image, twitter];
  const additional = ogSchemas[pageType];
  if (additional) {
    secs.push(additional);
  }
  return secs;
}

/**
 * Clear keys belonging to a previous type-specific schema when the page type changes.
 * Scalar fields → `""`; multi fields → `[""]` (parity with it-tools watcher intent).
 */
export function clearTypeSchemaKeys(
  metadata: OgFormMetadata,
  previousType: string,
): OgFormMetadata {
  const section = ogSchemas[previousType];
  if (!section) return metadata;

  const next: OgFormMetadata = { ...metadata };
  for (const element of section.elements) {
    next[element.key] = element.type === "input-multiple" ? [""] : "";
  }
  return next;
}

function asMultiValue(value: MetaFieldValue | undefined): string[] {
  if (Array.isArray(value)) return value.length > 0 ? value : [""];
  if (typeof value === "string" && value.length > 0) return [value];
  return [""];
}

/** Normalize multi-value fields before generation (arrays; drop pure empties later). */
export function normalizeMultiFields(
  metadata: OgFormMetadata,
  sections: OGSchemaType[],
): OgFormMetadata {
  const next: OgFormMetadata = { ...metadata };
  for (const section of sections) {
    for (const element of section.elements) {
      if (element.type === "input-multiple") {
        next[element.key] = asMultiValue(next[element.key]);
      }
    }
  }
  return next;
}

/**
 * Build HTML meta tags from the flat form state used by the island
 * (twitter:* keys split into the twitter object; rest → OG).
 */
export function buildOgMetaTags(metadata: OgFormMetadata): string {
  const twitterMeta: Record<string, MetaFieldValue> = {};
  const otherMeta: Record<string, MetaFieldValue> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (key.startsWith("twitter:")) {
      twitterMeta[key.slice("twitter:".length)] = value;
    } else {
      otherMeta[key] = value;
    }
  }

  return generateMeta(
    { ...otherMeta, twitter: twitterMeta },
    { generateTwitterCompatibleMeta: true },
  );
}

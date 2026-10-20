import { z } from "zod";

import { parseCards, type CustomCard } from "./custom";
import { LAYOUTS, type WallLayout } from "./layout";
import { ALL_COLLECTIONS } from "./selection";

export const BORDERS = ["red", "gold", "wood", "none"] as const;
export type BoardBorder = (typeof BORDERS)[number];

export const BORDER_LABELS: Record<BoardBorder, string> = {
  red: "Cinnabar",
  gold: "Gold leaf",
  wood: "Bare wood",
  none: "Unframed",
};

/** Seconds between swaps; 0 holds the current wall. */
export const ROTATION_OPTIONS = [0, 15, 30, 60, 300, 900] as const;

export const MIN_COUNT = 1;
export const MAX_COUNT = 12;

export const SETTINGS_STORAGE_KEY = "orthodox-screensaver:v1";

export type ScreensaverSettings = {
  count: number;
  collection: string;
  layout: WallLayout;
  border: BoardBorder;
  rotationSeconds: number;
  background: string;
  customCards: CustomCard[];
};

export function defaultSettings(backgroundIds: string[]): ScreensaverSettings {
  return {
    count: 5,
    collection: ALL_COLLECTIONS,
    layout: "iconostasis",
    border: "red",
    rotationSeconds: 60,
    background: backgroundIds[0] ?? "",
    customCards: [],
  };
}

export function formatRotation(seconds: number): string {
  if (seconds === 0) return "Off";
  if (seconds < 60) return `${seconds}s`;
  return `${seconds / 60} min`;
}

type Known = { collectionIds: string[]; backgroundIds: string[] };

/**
 * Validate stored settings field by field so one stale value (e.g. a
 * collection that was removed) doesn't reset everything else.
 */
export function parseSettings(raw: unknown, known: Known): ScreensaverSettings {
  const defaults = defaultSettings(known.backgroundIds);
  const source = z.record(z.string(), z.unknown()).safeParse(raw);
  if (!source.success) return defaults;

  const fields = {
    count: z.number().int().min(MIN_COUNT).max(MAX_COUNT),
    collection: z.enum([ALL_COLLECTIONS, ...known.collectionIds]),
    layout: z.enum(LAYOUTS),
    border: z.enum(BORDERS),
    rotationSeconds: z
      .number()
      .refine((v) => (ROTATION_OPTIONS as readonly number[]).includes(v)),
    background: z.string().refine((v) => known.backgroundIds.includes(v)),
  };

  function pick<K extends keyof typeof fields>(
    key: K,
  ): ScreensaverSettings[K] {
    const result = fields[key].safeParse(source.data?.[key]);
    return result.success
      ? (result.data as ScreensaverSettings[K])
      : defaults[key];
  }

  return {
    count: pick("count"),
    collection: pick("collection"),
    layout: pick("layout"),
    border: pick("border"),
    rotationSeconds: pick("rotationSeconds"),
    background: pick("background"),
    customCards: parseCards(source.data.customCards, known.collectionIds),
  };
}

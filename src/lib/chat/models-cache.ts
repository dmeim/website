import { OPENCODE_GO_MODELS_URL } from "./constants";
import { FALLBACK_GO_MODELS, normalizeGoModelsPayload } from "./models";
import type { GoModelInfo } from "./types";

const TTL_MS = 5 * 60 * 1000;

let cache: { models: GoModelInfo[]; expiresAt: number } | null = null;

/**
 * Fetch OpenCode Go models with a 5-minute in-memory cache.
 * Falls back to last successful cache, then FALLBACK_GO_MODELS.
 */
export async function getCachedGoModels(
  apiKey?: string | null,
): Promise<GoModelInfo[]> {
  const now = Date.now();
  if (cache && now < cache.expiresAt) {
    return cache.models;
  }

  try {
    const headers = new Headers();
    if (apiKey) {
      headers.set("Authorization", `Bearer ${apiKey}`);
    }
    const res = await fetch(OPENCODE_GO_MODELS_URL, { headers });
    if (!res.ok) {
      throw new Error(`models fetch failed: ${res.status}`);
    }
    const payload: unknown = await res.json();
    const models = normalizeGoModelsPayload(payload);
    cache = { models, expiresAt: now + TTL_MS };
    return models;
  } catch {
    if (cache?.models?.length) {
      return cache.models;
    }
    return [...FALLBACK_GO_MODELS];
  }
}

/** Test helper — clear the in-memory cache. */
export function clearGoModelsCache(): void {
  cache = null;
}

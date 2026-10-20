import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  SETTINGS_STORAGE_KEY,
  defaultSettings,
  parseSettings,
  type ScreensaverSettings,
} from "@/lib/orthodox/settings";
import type { OrthodoxCollection, WallBackground } from "@/lib/orthodox/types";

/** Settings persisted per browser; invalid or stale values fall back field by field. */
export function useScreensaverSettings(
  collections: OrthodoxCollection[],
  backgrounds: WallBackground[],
) {
  const known = useMemo(
    () => ({
      collectionIds: collections.map((c) => c.id),
      backgroundIds: backgrounds.map((b) => b.id),
    }),
    [collections, backgrounds],
  );
  const [settings, setSettings] = useState(() =>
    defaultSettings(known.backgroundIds),
  );
  const loaded = useRef(false);

  // Declared before the load effect so the mount pass never saves defaults
  // over what is stored.
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn("[orthodox] could not save settings", error);
    }
  }, [settings]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) setSettings(parseSettings(JSON.parse(raw), known));
    } catch (error) {
      console.warn("[orthodox] could not read saved settings", error);
    }
    loaded.current = true;
  }, [known]);

  const update = useCallback((patch: Partial<ScreensaverSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return { settings, update };
}

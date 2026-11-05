import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { parseQueryValue, parseStoredValue, withQueryValue, type QueryValue } from "@/lib/tools/persisted-state";

const STORAGE_PREFIX = "tools:";

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + key);
  } catch {
    // Storage can be blocked; the tool still works, it just won't remember settings.
    return null;
  }
}

function writeStorage(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Blocked or full storage only costs persistence, so it should not break the tool.
  }
}

/** Like useState, but remembered in this browser. For settings, never for secrets or pasted data. */
export function useStoredState<T>(
  key: string,
  defaultValue: T,
  isValid?: (value: T) => boolean,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => parseStoredValue(readStorage(key), defaultValue, isValid));

  useEffect(() => {
    writeStorage(key, value);
  }, [key, value]);

  return [value, setValue];
}

/** Like useState, but kept in the URL so a configured tool can be linked to or reloaded. */
export function useQueryState<T extends QueryValue>(
  name: string,
  defaultValue: T,
  isValid?: (value: T) => boolean,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() =>
    parseQueryValue(new URLSearchParams(window.location.search).get(name), defaultValue, isValid),
  );

  useEffect(() => {
    const { pathname, search, hash } = window.location;
    const next = withQueryValue(search, name, value, defaultValue);
    if (next === search) return;
    window.history.replaceState(window.history.state, "", `${pathname}${next}${hash}`);
  }, [name, value, defaultValue]);

  return [value, setValue];
}

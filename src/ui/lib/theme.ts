/**
 * Theme preference shared by ThemeControl and any React consumer. Storage key,
 * attributes and values match the BaseLayout pre-paint script.
 */

export type ThemePreference = "light" | "system" | "dark";
export type ResolvedTheme = "light" | "dark";

export interface ThemeEventDetail {
  preference: ThemePreference;
  theme: ResolvedTheme;
}

export const THEME_STORAGE_KEY = "theme";
export const THEME_EVENT = "ui:theme";
export const themePreferences: readonly ThemePreference[] = ["light", "system", "dark"];

const DARK_QUERY = "(prefers-color-scheme: dark)";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "system" || value === "dark";
}

export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemePreference(stored)) return stored;
  } catch {
    // Storage blocked: fall back to system.
  }
  return "system";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== "system") return preference;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function applyTheme(preference: ThemePreference): void {
  const root = document.documentElement;
  const theme = resolveTheme(preference);
  root.setAttribute("data-theme-pref", preference);
  root.setAttribute("data-theme", theme);
  syncControls(preference);
  document.dispatchEvent(
    new CustomEvent<ThemeEventDetail>(THEME_EVENT, { detail: { preference, theme } }),
  );
}

export function setThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Still applies for this page view.
  }
  applyTheme(preference);
}

export function subscribeTheme(listener: (detail: ThemeEventDetail) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<ThemeEventDetail>).detail);
  document.addEventListener(THEME_EVENT, handler);
  return () => document.removeEventListener(THEME_EVENT, handler);
}

let systemWatcherBound = false;

function watchSystemTheme(): void {
  if (systemWatcherBound) return;
  systemWatcherBound = true;
  window.matchMedia(DARK_QUERY).addEventListener("change", () => {
    if (getThemePreference() === "system") applyTheme("system");
  });
}

/** Read a preference from a control: radio value or data-ui-theme-value. */
function controlValue(el: Element): string | null {
  if (el instanceof HTMLInputElement) return el.value;
  return el.getAttribute("data-ui-theme-value");
}

function syncControls(preference: ThemePreference): void {
  document.querySelectorAll("[data-ui-theme-control]").forEach((group) => {
    group.querySelectorAll("input[type='radio'], [data-ui-theme-value]").forEach((el) => {
      const selected = controlValue(el) === preference;
      if (el instanceof HTMLInputElement) {
        el.checked = selected;
      } else if (el.getAttribute("role") === "radio") {
        el.setAttribute("aria-checked", String(selected));
      } else {
        el.setAttribute("aria-pressed", String(selected));
      }
    });
    group.setAttribute("data-value", preference);
    group.querySelectorAll("[data-ui-theme-cycle]").forEach((button) => {
      button.setAttribute("aria-label", `Theme: ${preference}. Switch to ${nextPreference(preference)}`);
    });
    syncSegmented(group as HTMLElement, preference);
  });
}

export function nextPreference(preference: ThemePreference): ThemePreference {
  return themePreferences[(themePreferences.indexOf(preference) + 1) % themePreferences.length];
}

/** Keep a SegmentedControl-based control's thumb on the checked radio. */
function syncSegmented(group: HTMLElement, preference: ThemePreference): void {
  if (!group.matches(".ui-segmented-control")) return;
  const index = themePreferences.indexOf(preference);
  const wasHidden = group.dataset.selected !== "true";
  if (wasHidden) group.dataset.instant = "true";
  group.style.setProperty("--ui-seg-index", String(index));
  group.dataset.selected = "true";
  if (wasHidden) requestAnimationFrame(() => requestAnimationFrame(() => delete group.dataset.instant));
}

/**
 * Bind every `[data-ui-theme-control]` group under `root`: radio inputs
 * (value = preference) or buttons with `data-ui-theme-value`. Idempotent,
 * safe to call on every `astro:page-load`.
 */
export function bindThemeControls(root: ParentNode = document): void {
  watchSystemTheme();
  root.querySelectorAll<HTMLElement>("[data-ui-theme-control]").forEach((group) => {
    if (group.dataset.bound === "1") return;
    group.dataset.bound = "1";
    group.addEventListener("change", (event) => {
      const value = event.target instanceof Element ? controlValue(event.target) : null;
      if (isThemePreference(value)) setThemePreference(value);
    });
    group.addEventListener("click", (event) => {
      const cycle = event.target instanceof Element
        ? event.target.closest("button[data-ui-theme-cycle]")
        : null;
      if (cycle) {
        setThemePreference(nextPreference(getThemePreference()));
        return;
      }
      const target = event.target instanceof Element
        ? event.target.closest("button[data-ui-theme-value]")
        : null;
      const value = target ? controlValue(target) : null;
      if (isThemePreference(value)) setThemePreference(value);
    });
  });
  syncControls(getThemePreference());
}

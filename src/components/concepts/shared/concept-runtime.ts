/**
 * Behaviour shared by every concept page: theme preference buttons and
 * scroll reveals. Concepts style the hooks; this file only toggles state.
 *
 * Hooks:
 * - `[data-theme-set="light|system|dark"]` buttons set the theme preference;
 *   the active one gets `aria-pressed="true"`.
 * - `[data-reveal]` elements get `data-revealed="true"` once in view.
 *   Children inside `[data-reveal-group]` receive `--reveal-index` for stagger.
 */

type ThemePreference = "light" | "system" | "dark";

const STORAGE_KEY = "theme";

function isPreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "system" || value === "dark";
}

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isPreference(stored)) return stored;
  } catch {
    // Storage blocked: fall through to system.
  }
  return "system";
}

function resolveTheme(pref: ThemePreference): "light" | "dark" {
  if (pref !== "system") return pref;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyPreference(pref: ThemePreference): void {
  const root = document.documentElement;
  root.setAttribute("data-theme-pref", pref);
  root.setAttribute("data-theme", resolveTheme(pref));
  document.querySelectorAll<HTMLElement>("[data-theme-set]").forEach((el) => {
    el.setAttribute("aria-pressed", String(el.dataset.themeSet === pref));
  });
  document.dispatchEvent(new CustomEvent("concept:theme", { detail: pref }));
}

function bindTheme(): void {
  applyPreference(readPreference());

  document.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      "[data-theme-set]",
    );
    const pref = target?.dataset.themeSet ?? null;
    if (!isPreference(pref)) return;
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      // Preference still applies for this page view.
    }
    applyPreference(pref);
  });

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (readPreference() === "system") applyPreference("system");
    });
}

function bindReveals(): void {
  document.querySelectorAll<HTMLElement>("[data-reveal-group]").forEach((group) => {
    group.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el, index) => {
      el.style.setProperty("--reveal-index", String(index));
    });
  });

  const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.setAttribute("data-revealed", "true"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.setAttribute("data-revealed", "true");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
  );

  targets.forEach((el) => observer.observe(el));
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function initConceptRuntime(): void {
  document.documentElement.classList.add("js");
  bindTheme();
  bindReveals();
}

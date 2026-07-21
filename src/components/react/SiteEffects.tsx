import { useEffect, useState } from "react";

import { MotionConfigProvider } from "../motion";
import GlyphField from "./GlyphField";
import LifeField from "./LifeField";

/**
 * Site ambient field mode.
 * - `"life"` — soft Game of Life (default for trial)
 * - `"wave"` — original dotted wave (GlyphField)
 *
 * Flip this constant to restore the wave background.
 */
const SITE_FIELD_MODE: "wave" | "life" = "life";

function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed.length === 0 ? "/" : trimmed;
}

/** Ambient Life stays off on the dedicated simulator so it doesn't compete. */
function shouldHideLifeAmbient(pathname: string): boolean {
  return normalizePath(pathname) === "/game-of-life/simulation";
}

/** Root motion config + ambient field (lightbox lives with page islands). */
export default function SiteEffects() {
  // Mount Life/wave immediately — do not start stuck on "none".
  // Sim route clears Life after mount so it doesn't compete with the simulator.
  const [field, setField] = useState<"wave" | "life" | "none">(SITE_FIELD_MODE);

  useEffect(() => {
    if (
      SITE_FIELD_MODE === "life" &&
      shouldHideLifeAmbient(window.location.pathname)
    ) {
      setField("none");
      return;
    }
    setField(SITE_FIELD_MODE);
  }, []);

  return (
    <MotionConfigProvider>
      {field === "wave" ? <GlyphField /> : null}
      {field === "life" ? <LifeField /> : null}
    </MotionConfigProvider>
  );
}

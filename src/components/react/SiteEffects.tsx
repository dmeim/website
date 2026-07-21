import { MotionConfigProvider } from "../motion";
import GlyphField from "./GlyphField";

/** Root motion config + ambient glyph field (lightbox lives with page islands). */
export default function SiteEffects() {
  return (
    <MotionConfigProvider>
      <GlyphField />
    </MotionConfigProvider>
  );
}

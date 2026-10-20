import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MotionConfigProvider } from "@/components/motion";
import type { OrthodoxCatalog } from "@/lib/orthodox/assets";
import { computeLayout } from "@/lib/orthodox/layout";
import {
  pickImages,
  poolFor,
  resizeSelection,
  rotateOne,
} from "@/lib/orthodox/selection";
import type { OrthodoxImage } from "@/lib/orthodox/types";

import { IconBoard } from "./IconBoard";
import { ScreensaverSettings } from "./ScreensaverSettings";
import { useAutoClose } from "./useAutoClose";
import { useElementSize } from "./useElementSize";
import { exitFullscreen, useFullscreen } from "./useFullscreen";
import { useIdle } from "./useIdle";
import { useScreensaverSettings } from "./useScreensaverSettings";
import { useWakeLock } from "./useWakeLock";
import "./OrthodoxScreensaver.css";

const AUTO_CLOSE_MS = 12_000;
const CURSOR_IDLE_MS = 3_000;
const HINT_MS = 5_000;

export function OrthodoxScreensaver({
  images,
  collections,
  backgrounds,
}: OrthodoxCatalog) {
  const wallRef = useRef<HTMLDivElement>(null);
  const size = useElementSize(wallRef);
  const { settings, update } = useScreensaverSettings(collections, backgrounds);

  const pool = useMemo(
    () => poolFor(images, settings.collection),
    [images, settings.collection],
  );
  const [hanging, setHanging] = useState<OrthodoxImage[]>([]);

  useEffect(() => {
    setHanging((current) => resizeSelection(current, pool, settings.count));
  }, [pool, settings.count]);

  useEffect(() => {
    if (settings.rotationSeconds === 0) return;
    const id = window.setInterval(
      () => setHanging((current) => rotateOne(current, pool)),
      settings.rotationSeconds * 1000,
    );
    return () => window.clearInterval(id);
  }, [pool, settings.rotationSeconds]);

  const boxes = useMemo(
    () => computeLayout(settings.layout, hanging.length, size),
    [settings.layout, hanging.length, size],
  );

  const [panelOpen, setPanelOpen] = useState(false);
  const closePanel = useCallback(() => setPanelOpen(false), []);
  const togglePanel = useCallback(() => setPanelOpen((open) => !open), []);
  const { cycle, poke } = useAutoClose(panelOpen, closePanel, AUTO_CLOSE_MS);

  const idle = useIdle(CURSOR_IDLE_MS);
  const fullscreen = useFullscreen();
  useWakeLock(true);

  const [hintVisible, setHintVisible] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setHintVisible(false), HINT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPanelOpen(false);
    }
    // Leaving the page should drop out of fullscreen with it.
    function onBeforeSwap() {
      void exitFullscreen();
    }
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("astro:before-swap", onBeforeSwap);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("astro:before-swap", onBeforeSwap);
    };
  }, []);

  const background =
    backgrounds.find((bg) => bg.id === settings.background) ?? backgrounds[0];
  const shuffle = () => setHanging(pickImages(pool, settings.count));

  return (
    <MotionConfigProvider>
      <div className="ow-stage" data-idle={idle && !panelOpen}>
        <div
          ref={wallRef}
          className="ow-wall"
          style={{ background: background?.css }}
          onClick={togglePanel}
        >
          <AnimatePresence>
            {hanging.map((image, i) =>
              boxes[i] ? (
                <IconBoard
                  key={i}
                  box={boxes[i]}
                  image={image}
                  border={settings.border}
                />
              ) : null,
            )}
          </AnimatePresence>

          {images.length === 0 ? (
            <p className="ow-empty">
              No icons yet. Add images to
              <code>src/assets/orthodox/icons/&lt;collection&gt;/</code>
            </p>
          ) : null}
        </div>

        <button
          type="button"
          className="ow-trigger"
          aria-expanded={panelOpen}
          aria-controls="ow-settings"
          onClick={togglePanel}
        >
          Settings
        </button>

        <AnimatePresence>
          {hintVisible && !panelOpen ? (
            <motion.p
              className="ow-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              Tap the wall to change the display
            </motion.p>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {panelOpen ? (
            <ScreensaverSettings
              settings={settings}
              onChange={update}
              collections={collections}
              backgrounds={backgrounds}
              totalImages={images.length}
              poolSize={pool.length}
              fullscreen={fullscreen}
              onShuffle={shuffle}
              onClose={closePanel}
              onActivity={poke}
              timer={{ cycle, ms: AUTO_CLOSE_MS }}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </MotionConfigProvider>
  );
}

export default OrthodoxScreensaver;

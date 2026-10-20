import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

import { MotionConfigProvider } from "@/components/motion";
import type { OrthodoxCatalog } from "@/lib/orthodox/assets";
import { addCard, describeLock, type CustomCard } from "@/lib/orthodox/custom";
import type { ScreensaverSettings as Settings } from "@/lib/orthodox/settings";

import { CardLockPanel } from "./CardLockPanel";
import { EditableCard } from "./EditableCard";
import { EditToolbar } from "./EditToolbar";
import { IconBoard } from "./IconBoard";
import { ScreensaverSettings } from "./ScreensaverSettings";
import { useAutoClose } from "./useAutoClose";
import { useElementSize } from "./useElementSize";
import { exitFullscreen, useFullscreen } from "./useFullscreen";
import { useIdle } from "./useIdle";
import { useScreensaverSettings } from "./useScreensaverSettings";
import { useWakeLock } from "./useWakeLock";
import { useWallBoards } from "./useWallBoards";
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
  const { settings, update, updateCards } = useScreensaverSettings(
    collections,
    backgrounds,
  );

  const custom = settings.layout === "custom";
  const [editing, setEditing] = useState(false);
  const [pickingId, setPickingId] = useState<string | null>(null);
  const arranging = editing && custom;
  const { boards, pool, shuffle, toCards } = useWallBoards(
    images,
    settings,
    size,
    arranging,
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

  const startEditing = useCallback(() => {
    setPanelOpen(false);
    setEditing(true);
  }, []);
  const stopEditing = useCallback(() => {
    setEditing(false);
    setPickingId(null);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (pickingId) setPickingId(null);
      else if (editing) stopEditing();
      else setPanelOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pickingId, editing, stopEditing]);

  useEffect(() => {
    // Leaving the page should drop out of fullscreen with it.
    function onBeforeSwap() {
      void exitFullscreen();
    }
    document.addEventListener("astro:before-swap", onBeforeSwap);
    return () =>
      document.removeEventListener("astro:before-swap", onBeforeSwap);
  }, []);

  /** The first switch to Custom starts from the wall as it hangs now. */
  function changeSettings(patch: Partial<Settings>) {
    const enteringCustom = patch.layout === "custom" && !custom;
    if (enteringCustom && settings.customCards.length === 0) {
      update({ ...patch, customCards: toCards() });
      startEditing();
      return;
    }
    update(patch);
  }

  const replaceCard = useCallback(
    (next: CustomCard) =>
      updateCards((cards) =>
        cards.map((card) => (card.id === next.id ? next : card)),
      ),
    [updateCards],
  );
  const removeCard = (id: string) => {
    updateCards((cards) => cards.filter((card) => card.id !== id));
    if (pickingId === id) setPickingId(null);
  };
  const appendCard = () =>
    updateCards((cards) => [...cards, addCard(cards, size)]);

  const picking = boards.find((board) => board.card?.id === pickingId);
  const pickingCard = picking?.card;
  const background =
    backgrounds.find((bg) => bg.id === settings.background) ?? backgrounds[0];

  // While arranging, only a tap on bare wall dismisses the card panel; taps on
  // a card's own controls bubble here too.
  function onWallClick(event: MouseEvent<HTMLDivElement>) {
    if (!arranging) togglePanel();
    else if (event.target === event.currentTarget) setPickingId(null);
  }

  return (
    <MotionConfigProvider>
      <div
        className="ow-stage"
        data-idle={idle && !panelOpen && !arranging}
        data-arranging={arranging || undefined}
      >
        <div
          ref={wallRef}
          className="ow-wall"
          style={{ background: background?.css }}
          onClick={onWallClick}
        >
          <AnimatePresence>
            {boards.map((board) =>
              board.card ? (
                <EditableCard
                  key={board.key}
                  card={board.card}
                  box={board.box}
                  image={board.image}
                  border={settings.border}
                  size={size}
                  editing={arranging}
                  lock={describeLock(board.card.lock, images, collections)}
                  onChange={replaceCard}
                  onRemove={() => removeCard(board.key)}
                  onPick={() => setPickingId(board.key)}
                />
              ) : (
                <IconBoard
                  key={board.key}
                  box={board.box}
                  image={board.image}
                  border={settings.border}
                />
              ),
            )}
          </AnimatePresence>

          {images.length === 0 ? (
            <p className="ow-empty">
              No icons yet. Add images to
              <code>src/assets/orthodox/icons/&lt;collection&gt;/</code>
            </p>
          ) : custom && boards.length === 0 && !arranging ? (
            <p className="ow-empty">
              This custom wall has no cards. Open the settings and choose
              Arrange wall to add some.
            </p>
          ) : null}
        </div>

        <AnimatePresence>
          {arranging ? (
            <EditToolbar
              count={settings.customCards.length}
              onAdd={appendCard}
              onDone={stopEditing}
            />
          ) : null}
        </AnimatePresence>

        {!arranging ? (
          <button
            type="button"
            className="ow-trigger"
            aria-expanded={panelOpen}
            aria-controls="ow-settings"
            onClick={togglePanel}
          >
            Settings
          </button>
        ) : null}

        <AnimatePresence>
          {hintVisible && !panelOpen && !arranging ? (
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
              onChange={changeSettings}
              collections={collections}
              backgrounds={backgrounds}
              totalImages={images.length}
              poolSize={pool.length}
              fullscreen={fullscreen}
              onShuffle={shuffle}
              onArrange={startEditing}
              onClose={closePanel}
              onActivity={poke}
              timer={{ cycle, ms: AUTO_CLOSE_MS }}
            />
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {arranging && pickingCard ? (
            <CardLockPanel
              key={pickingCard.id}
              lock={pickingCard.lock}
              shown={picking?.image}
              images={images}
              collections={collections}
              onChange={(lock) => replaceCard({ ...pickingCard, lock })}
              onClose={() => setPickingId(null)}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </MotionConfigProvider>
  );
}

export default OrthodoxScreensaver;

import { motion } from "framer-motion";

import { LAYOUTS, LAYOUT_LABELS } from "@/lib/orthodox/layout";
import { ALL_COLLECTIONS } from "@/lib/orthodox/selection";
import {
  BORDERS,
  BORDER_LABELS,
  MAX_COUNT,
  MIN_COUNT,
  ROTATION_OPTIONS,
  formatRotation,
  type ScreensaverSettings as Settings,
} from "@/lib/orthodox/settings";
import type { OrthodoxCollection, WallBackground } from "@/lib/orthodox/types";

import { SegmentedChoice } from "./SegmentedChoice";

type ScreensaverSettingsProps = {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  collections: OrthodoxCollection[];
  backgrounds: WallBackground[];
  totalImages: number;
  poolSize: number;
  fullscreen: { supported: boolean; active: boolean; toggle: () => void };
  onShuffle: () => void;
  onClose: () => void;
  onActivity: () => void;
  timer: { cycle: number; ms: number };
};

const LAYOUT_OPTIONS = LAYOUTS.map((value) => ({
  value,
  label: LAYOUT_LABELS[value],
}));
const BORDER_OPTIONS = BORDERS.map((value) => ({
  value,
  label: BORDER_LABELS[value],
}));
const ROTATION_CHOICES = ROTATION_OPTIONS.map((seconds) => ({
  value: String(seconds),
  label: formatRotation(seconds),
}));

export function ScreensaverSettings({
  settings,
  onChange,
  collections,
  backgrounds,
  totalImages,
  poolSize,
  fullscreen,
  onShuffle,
  onClose,
  onActivity,
  timer,
}: ScreensaverSettingsProps) {
  return (
    <motion.aside
      id="ow-settings"
      className="ow-panel"
      aria-label="Screensaver settings"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.25 }}
      onPointerDown={onActivity}
      onPointerMove={onActivity}
      onKeyDown={onActivity}
      onWheel={onActivity}
      onFocus={onActivity}
    >
      <span
        key={timer.cycle}
        className="ow-panel__timer"
        style={{ animationDuration: `${timer.ms}ms` }}
        aria-hidden="true"
      />

      <div className="ow-panel__head">
        <h2 className="ow-panel__title">Wall</h2>
        <button
          type="button"
          className="ow-panel__close"
          aria-label="Close settings"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <label className="ow-field">
        <span className="ow-field__label">Collection</span>
        <select
          className="ow-select"
          value={settings.collection}
          onChange={(e) => onChange({ collection: e.target.value })}
        >
          <option value={ALL_COLLECTIONS}>All ({totalImages})</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label} ({c.count})
            </option>
          ))}
        </select>
      </label>

      <label className="ow-field">
        <span className="ow-field__label">
          Icons <output className="ow-field__value">{settings.count}</output>
        </span>
        <input
          className="ow-range"
          type="range"
          min={MIN_COUNT}
          max={MAX_COUNT}
          value={settings.count}
          onChange={(e) => onChange({ count: Number(e.target.value) })}
        />
        {poolSize < settings.count ? (
          <span className="ow-field__note">
            Only {poolSize} in this collection.
          </span>
        ) : null}
      </label>

      <SegmentedChoice
        legend="Layout"
        options={LAYOUT_OPTIONS}
        value={settings.layout}
        onChange={(layout) => onChange({ layout })}
      />

      <SegmentedChoice
        legend="Border"
        options={BORDER_OPTIONS}
        value={settings.border}
        onChange={(border) => onChange({ border })}
        swatches
      />

      <SegmentedChoice
        legend="Rotate every"
        options={ROTATION_CHOICES}
        value={String(settings.rotationSeconds)}
        onChange={(v) => onChange({ rotationSeconds: Number(v) })}
      />

      <fieldset className="ow-field">
        <legend className="ow-field__label">Background</legend>
        <div className="ow-backgrounds">
          {backgrounds.map((bg) => (
            <button
              key={bg.id}
              type="button"
              className="ow-background"
              aria-pressed={bg.id === settings.background}
              onClick={() => onChange({ background: bg.id })}
            >
              <span
                className="ow-background__swatch"
                style={{ background: bg.css }}
                aria-hidden="true"
              />
              <span className="ow-background__label">{bg.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="ow-panel__actions">
        {fullscreen.supported ? (
          <button
            type="button"
            className="btn btn--primary"
            onClick={fullscreen.toggle}
          >
            {fullscreen.active ? "Exit fullscreen" : "Fullscreen"}
          </button>
        ) : null}
        <button type="button" className="btn btn--ghost" onClick={onShuffle}>
          Shuffle
        </button>
        <a className="btn btn--ghost" href="/orthodox">
          Leave
        </a>
      </div>
    </motion.aside>
  );
}

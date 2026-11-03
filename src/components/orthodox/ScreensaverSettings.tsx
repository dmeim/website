import { LAYOUTS, LAYOUT_LABELS, type WallLayout } from "@/lib/orthodox/layout";
import { ALL_COLLECTIONS } from "@/lib/orthodox/selection";
import {
  BORDERS,
  BORDER_LABELS,
  MAX_COUNT,
  MIN_COUNT,
  ROTATION_OPTIONS,
  formatRotation,
  type BoardBorder,
  type ScreensaverSettings as Settings,
} from "@/lib/orthodox/settings";
import type { OrthodoxCollection, WallBackground } from "@/lib/orthodox/types";
import {
  Button,
  Fieldset,
  Progress,
  SegmentedControl,
  Select,
  Slider,
  Swatch,
} from "@/ui/react";

import { OrthodoxSheet } from "./OrthodoxSheet";

type ScreensaverSettingsProps = {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  collections: OrthodoxCollection[];
  backgrounds: WallBackground[];
  totalImages: number;
  poolSize: number;
  fullscreen: { supported: boolean; active: boolean; toggle: () => void };
  onShuffle: () => void;
  onArrange: () => void;
  onClose: () => void;
  onActivity: () => void;
  timer: { cycle: number; ms: number };
};

/** Chips mirror the board frame fills in OrthodoxScreensaver.css. */
const BORDER_SWATCHES: Record<BoardBorder, string> = {
  red: "var(--ui-danger)",
  gold: "var(--ui-accent)",
  wood: "color-mix(in srgb, var(--ui-accent) 45%, var(--ui-ink))",
  none: "transparent",
};

const LAYOUT_OPTIONS = LAYOUTS.map((value) => ({
  value,
  label: LAYOUT_LABELS[value],
}));
const BORDER_OPTIONS = BORDERS.map((value) => ({
  value,
  label: BORDER_LABELS[value],
  swatch: BORDER_SWATCHES[value],
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
  onArrange,
  onClose,
  onActivity,
  timer,
}: ScreensaverSettingsProps) {
  const custom = settings.layout === "custom";
  const collectionOptions = [
    { value: ALL_COLLECTIONS, label: `All (${totalImages})` },
    ...collections.map((c) => ({
      value: c.id,
      label: `${c.label} (${c.count})`,
    })),
  ];
  return (
    <OrthodoxSheet
      id="ow-settings"
      title="Wall"
      onClose={onClose}
      onPointerDown={onActivity}
      onPointerMove={onActivity}
      onKeyDown={onActivity}
      onWheel={onActivity}
      onFocus={onActivity}
    >
      <Progress
        key={timer.cycle}
        className="ow-panel__timer"
        size="sm"
        label="Closes automatically"
        labelHidden
        duration={timer.ms}
      />

      <div className="ow-panel__fields">
        <Fieldset legend="Icons" className="ow-group">
          <Select
            label="Collection"
            size="sm"
            options={collectionOptions}
            value={settings.collection}
            onChange={(e) => onChange({ collection: e.target.value })}
          />

          {custom ? null : (
            <div className="ow-field">
              <Slider
                label="How many"
                min={MIN_COUNT}
                max={MAX_COUNT}
                showValue
                value={settings.count}
                onChange={(count) => onChange({ count: count as number })}
              />
              {poolSize < settings.count ? (
                <p className="ow-field__note">
                  Only {poolSize} in this collection.
                </p>
              ) : null}
            </div>
          )}

          <SegmentedControl
            className="ow-segments"
            name="ow-layout"
            label="Layout"
            size="sm"
            equal={false}
            options={LAYOUT_OPTIONS}
            value={settings.layout}
            onChange={(layout) => onChange({ layout: layout as WallLayout })}
          />

          {custom ? (
            <div className="ow-field ow-field--row">
              <p className="ow-field__note">
                {settings.customCards.length} cards. Unlocked cards draw from
                the collection above.
              </p>
              <Button size="sm" iconStart="pencil-simple" onClick={onArrange}>
                Arrange wall
              </Button>
            </div>
          ) : null}
        </Fieldset>

        <Fieldset legend="Frame" className="ow-group">
          <SegmentedControl
            className="ow-segments ow-segments--grid"
            name="ow-border"
            label="Border"
            size="sm"
            indicator="fill"
            options={BORDER_OPTIONS}
            value={settings.border}
            onChange={(border) => onChange({ border: border as BoardBorder })}
          />

          <fieldset className="ow-field">
            <legend className="ow-field__label">Background</legend>
            <div className="ow-backgrounds">
              {backgrounds.map((bg) => (
                <Swatch
                  key={bg.id}
                  as="button"
                  size="sm"
                  className="ow-background"
                  color={bg.css}
                  label={bg.label}
                  selected={bg.id === settings.background}
                  onClick={() => onChange({ background: bg.id })}
                />
              ))}
            </div>
          </fieldset>
        </Fieldset>

        <Fieldset legend="Timing" className="ow-group">
          <SegmentedControl
            className="ow-segments"
            name="ow-rotation"
            label="Change icons every"
            size="sm"
            equal={false}
            options={ROTATION_CHOICES}
            value={String(settings.rotationSeconds)}
            onChange={(v) => onChange({ rotationSeconds: Number(v) })}
          />
        </Fieldset>
      </div>

      <div className="ow-panel__actions">
        {fullscreen.supported ? (
          <Button
            size="sm"
            variant="primary"
            iconStart={fullscreen.active ? "corners-in" : "corners-out"}
            onClick={fullscreen.toggle}
          >
            {fullscreen.active ? "Exit fullscreen" : "Fullscreen"}
          </Button>
        ) : null}
        <Button size="sm" iconStart="shuffle" onClick={onShuffle}>
          Shuffle
        </Button>
        <Button size="sm" variant="ghost" href="/orthodox">
          Leave
        </Button>
      </div>
    </OrthodoxSheet>
  );
}

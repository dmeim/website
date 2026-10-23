import { useEffect, useMemo, useRef, useState } from "react";

import type { CardLock } from "@/lib/orthodox/custom";
import type { OrthodoxCollection, OrthodoxImage } from "@/lib/orthodox/types";

import { Icon } from "@/ui/icons";
import { Button, Select } from "@/ui/react";

import { OrthodoxSheet } from "./OrthodoxSheet";
import { SegmentedChoice } from "./SegmentedChoice";

type CardLockPanelProps = {
  lock: CardLock;
  /** What the card shows right now; "One icon" starts from it. */
  shown?: OrthodoxImage;
  images: OrthodoxImage[];
  collections: OrthodoxCollection[];
  onChange: (lock: CardLock) => void;
  onClose: () => void;
};

const KIND_OPTIONS = [
  { value: "any", label: "Any icon" },
  { value: "collection", label: "A group" },
  { value: "icon", label: "One icon" },
] as const;

export function CardLockPanel({
  lock,
  shown,
  images,
  collections,
  onChange,
  onClose,
}: CardLockPanelProps) {
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  function setKind(kind: CardLock["kind"]) {
    if (kind === "any") onChange({ kind });
    if (kind === "collection") {
      onChange({
        kind,
        collection: shown?.collection ?? collections[0]?.id ?? "",
      });
    }
    if (kind === "icon") {
      onChange({ kind, imageId: shown?.id ?? images[0]?.id ?? "" });
    }
  }

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return collections
      .map((collection) => ({
        collection,
        items: images.filter(
          (image) =>
            image.collection === collection.id &&
            (!q || image.title.toLowerCase().includes(q)),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [collections, images, query]);

  const lockedId = lock.kind === "icon" ? lock.imageId : null;
  useEffect(() => {
    if (lock.kind !== "icon") return;
    listRef.current
      ?.querySelector('[aria-pressed="true"]')
      ?.scrollIntoView({ block: "center" });
    // Only when switching into icon mode, not on every pick.
  }, [lock.kind]);

  return (
    <OrthodoxSheet
      className="ow-panel--lock"
      title="Card"
      onClose={onClose}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="ow-panel__fields">
        <SegmentedChoice
          legend="Shows"
          name="ow-lock-kind"
          options={KIND_OPTIONS}
          value={lock.kind}
          onChange={setKind}
        />

        {lock.kind === "any" ? (
          <p className="ow-field__note">
            Draws from the wall's Collection setting and rotates with the rest.
          </p>
        ) : null}

        {lock.kind === "collection" ? (
          <Select
            label="Group"
            size="sm"
            hint="Rotates through this group only."
            options={collections.map((c) => ({
              value: c.id,
              label: `${c.label} (${c.count})`,
            }))}
            value={lock.collection}
            onChange={(e) =>
              onChange({ kind: "collection", collection: e.target.value })
            }
          />
        ) : null}

        {lock.kind === "icon" ? (
          <div className="ow-picker">
            <label className="ow-picker__search">
              <Icon name="magnifying-glass" />
              <input
                type="search"
                placeholder="Search by name"
                aria-label="Search icons by name"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div ref={listRef} className="ow-picker__list">
              {groups.map(({ collection, items }) => (
                <section key={collection.id} className="ow-picker__group">
                  <h3 className="ow-picker__heading">{collection.label}</h3>
                  {items.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      className="ow-pick"
                      aria-pressed={image.id === lockedId}
                      onClick={() =>
                        onChange({ kind: "icon", imageId: image.id })
                      }
                    >
                      <img
                        className="ow-pick__thumb"
                        src={image.thumb}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="ow-pick__title">{image.title}</span>
                    </button>
                  ))}
                </section>
              ))}
              {groups.length === 0 ? (
                <p className="ow-field__note">No icon matches “{query}”.</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="ow-panel__actions">
        <Button size="sm" variant="primary" onClick={onClose}>
          Done
        </Button>
      </div>
    </OrthodoxSheet>
  );
}

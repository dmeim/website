import { motion } from "framer-motion";
import { Search } from "lucide";
import { useEffect, useMemo, useRef, useState } from "react";

import { LucideIcon } from "@/components/chat/LucideIcon";
import type { CardLock } from "@/lib/orthodox/custom";
import type { OrthodoxCollection, OrthodoxImage } from "@/lib/orthodox/types";

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
    <motion.aside
      className="ow-panel ow-panel--lock"
      aria-label="What this card shows"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.25 }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="ow-panel__head">
        <h2 className="ow-panel__title">Card</h2>
        <button
          type="button"
          className="ow-panel__close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <SegmentedChoice
        legend="Shows"
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
        <label className="ow-field">
          <span className="ow-field__label">Group</span>
          <select
            className="ow-select"
            value={lock.collection}
            onChange={(e) =>
              onChange({ kind: "collection", collection: e.target.value })
            }
          >
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label} ({c.count})
              </option>
            ))}
          </select>
          <span className="ow-field__note">
            Rotates through this group only.
          </span>
        </label>
      ) : null}

      {lock.kind === "icon" ? (
        <div className="ow-picker">
          <label className="ow-picker__search">
            <LucideIcon icon={Search} size={15} />
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

      <div className="ow-panel__actions">
        <button type="button" className="btn btn--primary" onClick={onClose}>
          Done
        </button>
      </div>
    </motion.aside>
  );
}

import { useEffect, useId, useState } from "react";
import type { LibraryAssetSummary } from "@/lib/chat/types";
import { libraryContentUrl } from "./api";

type LibraryPickerModalProps = {
  assets: LibraryAssetSummary[];
  pendingIds: Set<string>;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (assets: LibraryAssetSummary[]) => void;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function LibraryPickerModal({
  assets,
  pendingIds,
  loading = false,
  onClose,
  onConfirm,
}: LibraryPickerModalProps) {
  const titleId = useId();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(assets.filter((asset) => selected.has(asset.id)));
  };

  return (
    <div
      className="chat-library-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="chat-library-modal__backdrop"
        aria-label="Close library picker"
        onClick={onClose}
      />
      <div className="chat-library-modal__panel">
        <header className="chat-library-modal__header">
          <h2 id={titleId} className="chat-library-modal__title">
            Attach from library
          </h2>
          <button
            type="button"
            className="chat-btn chat-btn--ghost"
            onClick={onClose}
          >
            Cancel
          </button>
        </header>

        <div className="chat-library-modal__body">
          {loading ? (
            <p className="chat-empty">Loading library…</p>
          ) : assets.length === 0 ? (
            <p className="chat-empty">
              No assets yet. Upload images or files from the + menu.
            </p>
          ) : (
            <ul className="chat-library-modal__list">
              {assets.map((asset) => {
                const alreadyPending = pendingIds.has(asset.id);
                const checked = selected.has(asset.id);
                return (
                  <li key={asset.id}>
                    <label
                      className={
                        alreadyPending
                          ? "chat-library-modal__item chat-library-modal__item--pending"
                          : "chat-library-modal__item"
                      }
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={alreadyPending}
                        onChange={() => toggle(asset.id)}
                      />
                      <span className="chat-library-modal__meta">
                        <span className="chat-library-modal__kind">
                          {asset.kind}
                        </span>
                        <a
                          href={libraryContentUrl(asset.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="chat-library-modal__name"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {asset.filename}
                        </a>
                        <span className="chat-library-modal__size">
                          {formatBytes(asset.byteSize)}
                          {alreadyPending ? " · already attached" : ""}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="chat-library-modal__footer">
          <span className="chat-library-modal__count">
            {selected.size === 0
              ? "Select items to attach"
              : `${selected.size} selected`}
          </span>
          <button
            type="button"
            className="chat-btn"
            disabled={selected.size === 0}
            onClick={handleConfirm}
          >
            Attach
          </button>
        </footer>
      </div>
    </div>
  );
}

import type { LibraryAssetSummary } from "@/lib/chat/types";
import { libraryContentUrl } from "./api";

type LibraryPaneProps = {
  assets: LibraryAssetSummary[];
  busy?: boolean;
  onOpenSidebar: () => void;
  onUploadClick: () => void;
  onAttach: (asset: LibraryAssetSummary) => void;
  onDelete: (asset: LibraryAssetSummary) => void;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function LibraryPane({
  assets,
  busy = false,
  onOpenSidebar,
  onUploadClick,
  onAttach,
  onDelete,
}: LibraryPaneProps) {
  return (
    <>
      <header className="chat-main__header">
        <button
          type="button"
          className="chat-main__menu"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
        >
          Menu
        </button>
        <div className="chat-main__title-block">
          <h1 className="chat-main__title">Library</h1>
        </div>
      </header>

      <div className="chat-library">
        <div className="chat-library__toolbar">
          <button
            type="button"
            className="chat-btn"
            onClick={onUploadClick}
            disabled={busy}
          >
            Upload
          </button>
          <p className="chat-library__hint">
            Uploads stay in the Library and can be attached to any chat.
          </p>
        </div>
        {assets.length === 0 ? (
          <p className="chat-empty">No assets yet. Upload a file to begin.</p>
        ) : (
          <ul className="chat-library__grid">
            {assets.map((asset) => (
              <li key={asset.id} className="chat-library__card">
                <div className="chat-library__meta">
                  <span className="chat-library__kind">{asset.kind}</span>
                  <a
                    href={libraryContentUrl(asset.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="chat-library__name"
                  >
                    {asset.filename}
                  </a>
                  <span className="chat-library__size">
                    {formatBytes(asset.byteSize)}
                  </span>
                </div>
                <div className="chat-library__card-actions">
                  <button
                    type="button"
                    className="chat-btn chat-btn--ghost"
                    onClick={() => onAttach(asset)}
                  >
                    Attach
                  </button>
                  <button
                    type="button"
                    className="chat-btn chat-btn--danger"
                    onClick={() => onDelete(asset)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

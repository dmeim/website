import type { LibraryAssetSummary } from "@/lib/chat/types";
import { Button, EmptyState, List, ListRow } from "@/ui/react";
import { libraryContentUrl } from "./api";
import { formatBytes } from "./format-bytes";
import { PaneHeader } from "./PaneHeader";

type LibraryPaneProps = {
  assets: LibraryAssetSummary[];
  busy?: boolean;
  onOpenSidebar: () => void;
  onUploadClick: () => void;
  onAttach: (asset: LibraryAssetSummary) => void;
  onDelete: (asset: LibraryAssetSummary) => void;
};

export function LibraryPane({ assets, busy = false, onOpenSidebar, onUploadClick, onAttach, onDelete }: LibraryPaneProps) {
  return (
    <>
      <PaneHeader title="Library" onOpenSidebar={onOpenSidebar} />

      <div className="chat-pane-body">
        <div className="chat-pane-body__toolbar">
          <Button variant="primary" iconStart="upload-simple" onClick={onUploadClick} disabled={busy}>
            Upload
          </Button>
          <p className="chat-pane-body__hint">Uploads stay in the Library and can be attached to any chat.</p>
        </div>
        {assets.length === 0 ? (
          <EmptyState icon="books" title="No assets yet." description="Upload a file to begin." />
        ) : (
          <List className="chat-pane-list" label="Library assets">
            {assets.map((asset) => (
              <ListRow
                key={asset.id}
                label={asset.kind}
                title={
                  <a href={libraryContentUrl(asset.id)} target="_blank" rel="noreferrer" className="chat-pane-list__link">
                    {asset.filename}
                  </a>
                }
                meta={formatBytes(asset.byteSize)}
                actions={
                  <>
                    <Button variant="ghost" size="sm" onClick={() => onAttach(asset)}>
                      Attach
                    </Button>
                    <Button variant="danger" size="sm" iconStart="trash" onClick={() => onDelete(asset)}>
                      Delete
                    </Button>
                  </>
                }
              />
            ))}
          </List>
        )}
      </div>
    </>
  );
}

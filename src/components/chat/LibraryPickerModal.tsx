import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { LibraryAssetSummary } from "@/lib/chat/types";
import { Button, Dialog, EmptyState, IconButton, List, ListRow, Spinner } from "@/ui/react";
import { libraryContentUrl } from "./api";
import { formatBytes } from "./format-bytes";

type LibraryPickerModalProps = {
  assets: LibraryAssetSummary[];
  pendingIds: Set<string>;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (assets: LibraryAssetSummary[]) => void;
};

export function LibraryPickerModal({ assets, pendingIds, loading = false, onClose, onConfirm }: LibraryPickerModalProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const opener = useRef<HTMLElement | null>(typeof document === "undefined" ? null : (document.activeElement as HTMLElement | null));

  // The parent unmounts this on close, so the Dialog's own close-event focus return never runs.
  useEffect(() => {
    const el = opener.current;
    return () => {
      // The opener is usually an attach-menu item that closed with the menu.
      const target = el?.isConnected
        ? el
        : document.querySelector<HTMLElement>('.chat-composer button[aria-label="Attach"], .chat-composer textarea');
      target?.focus();
    };
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Mark Escape handled so the shell's global Escape doesn't also stop a generation.
  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      onKeyDown={onKeyDown}
      title="Attach from library"
      closeLabel="Close library picker"
      className="chat-picker"
      footer={
        <>
          <span className="chat-picker__count">
            {selected.size === 0 ? "Select items to attach" : `${selected.size} selected`}
          </span>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={selected.size === 0}
            onClick={() => onConfirm(assets.filter((asset) => selected.has(asset.id)))}
          >
            Attach
          </Button>
        </>
      }
    >
      {loading ? (
        <Spinner label="Loading library" />
      ) : assets.length === 0 ? (
        <EmptyState size="sm" icon="books" title="No assets yet." description="Upload images or files from the + menu." />
      ) : (
        <List density="compact" label="Library assets">
          {assets.map((asset) => {
            const alreadyPending = pendingIds.has(asset.id);
            return (
              <ListRow
                key={asset.id}
                label={asset.kind}
                title={asset.filename}
                meta={`${formatBytes(asset.byteSize)}${alreadyPending ? " · already attached" : ""}`}
                selected={selected.has(asset.id)}
                disabled={alreadyPending}
                arrow={false}
                onSelect={() => toggle(asset.id)}
                actions={
                  <IconButton
                    icon="arrow-square-out"
                    label={`Open ${asset.filename}`}
                    size="sm"
                    tooltip={false}
                    href={libraryContentUrl(asset.id)}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              />
            );
          })}
        </List>
      )}
    </Dialog>
  );
}

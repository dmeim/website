import type { ChatSummary } from "@/lib/chat/types";
import { Button, EmptyState, List, ListRow, Notice, Spinner } from "@/ui/react";
import { PaneHeader } from "./PaneHeader";

type ArchivePaneProps = {
  chats: ChatSummary[];
  loading?: boolean;
  busy?: boolean;
  banner?: string | null;
  onOpenSidebar: () => void;
  onDismissBanner?: () => void;
  onRestore: (id: string) => void;
  onDelete: (id: string, title: string) => void;
};

export function ArchivePane({
  chats,
  loading = false,
  busy = false,
  banner = null,
  onOpenSidebar,
  onDismissBanner,
  onRestore,
  onDelete,
}: ArchivePaneProps) {
  return (
    <>
      <PaneHeader title="Archive" onOpenSidebar={onOpenSidebar} />

      <div className="chat-pane-body">
        <p className="chat-pane-body__hint">
          Restored chats return to the sidebar. Delete removes the thread and its messages permanently.
        </p>

        {banner ? (
          <Notice
            tone="accent"
            actions={
              onDismissBanner ? (
                <Button variant="ghost" size="sm" onClick={onDismissBanner}>
                  Dismiss
                </Button>
              ) : null
            }
          >
            {banner}
          </Notice>
        ) : null}

        {loading ? (
          <Spinner label="Loading archived chats" />
        ) : chats.length === 0 ? (
          <EmptyState icon="archive" title="No archived chats." />
        ) : (
          <List className="chat-pane-list" label="Archived chats">
            {chats.map((chat) => (
              <ListRow
                key={chat.id}
                title={chat.title}
                description={
                  <>
                    {chat.modelId}
                    {chat.archivedAt ? ` · archived ${new Date(chat.archivedAt).toLocaleString()}` : null}
                  </>
                }
                actions={
                  <>
                    <Button variant="ghost" size="sm" iconStart="box-arrow-up" disabled={busy} onClick={() => onRestore(chat.id)}>
                      Restore
                    </Button>
                    <Button variant="danger" size="sm" iconStart="trash" disabled={busy} onClick={() => onDelete(chat.id, chat.title)}>
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

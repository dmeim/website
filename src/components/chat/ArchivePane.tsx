import { ArchiveRestore, Trash2 } from "lucide";
import type { ChatSummary } from "@/lib/chat/types";
import { LucideIcon } from "./LucideIcon";

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
          <h1 className="chat-main__title">Archive</h1>
        </div>
      </header>

      <div className="chat-archive">
        <p className="chat-archive__hint">
          Restored chats return to the sidebar. Delete removes the thread and
          its messages permanently.
        </p>

        {banner ? (
          <p className="chat-archive__banner" role="status">
            {banner}
            {onDismissBanner ? (
              <button type="button" onClick={onDismissBanner}>
                Dismiss
              </button>
            ) : null}
          </p>
        ) : null}

        {loading ? (
          <p className="chat-empty">Loading…</p>
        ) : chats.length === 0 ? (
          <p className="chat-empty">No archived chats.</p>
        ) : (
          <ul className="chat-archive__list">
            {chats.map((chat) => (
              <li key={chat.id} className="chat-archive__item">
                <div className="chat-archive__meta">
                  <h2 className="chat-archive__item-title">{chat.title}</h2>
                  <p className="chat-archive__item-sub">
                    {chat.modelId}
                    {chat.archivedAt
                      ? ` · archived ${new Date(chat.archivedAt).toLocaleString()}`
                      : null}
                  </p>
                </div>
                <div className="chat-archive__actions">
                  <button
                    type="button"
                    className="chat-btn chat-btn--ghost"
                    disabled={busy}
                    onClick={() => onRestore(chat.id)}
                  >
                    <LucideIcon icon={ArchiveRestore} size={14} />
                    Restore
                  </button>
                  <button
                    type="button"
                    className="chat-btn chat-btn--danger"
                    disabled={busy}
                    onClick={() => onDelete(chat.id, chat.title)}
                  >
                    <LucideIcon icon={Trash2} size={14} />
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

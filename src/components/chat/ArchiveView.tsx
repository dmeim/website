import { useCallback, useEffect, useState } from "react";
import type { ChatSummary } from "@/lib/chat";
import { deleteChat, fetchChats, patchChat } from "./api";
import "./ArchiveView.css";

export default function ArchiveView() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await fetchChats(true);
    setChats(list);
    return list;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await refresh();
        if (!cancelled) setChats(list);
      } catch (err) {
        if (!cancelled) {
          setBanner(
            err instanceof Error ? err.message : "Failed to load archive",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const restore = async (id: string) => {
    try {
      await patchChat(id, { archived: false });
      await refresh();
      setBanner("Chat restored.");
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Restore failed");
    }
  };

  const remove = async (id: string, title: string) => {
    if (!window.confirm(`Permanently delete “${title}”?`)) return;
    try {
      await deleteChat(id);
      await refresh();
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <section className="chat-archive" aria-labelledby="chat-archive-heading">
      <header className="chat-archive__intro">
        <p className="chat-archive__eyebrow">Private chat</p>
        <h1 id="chat-archive-heading" className="chat-archive__title">
          Archive
        </h1>
        <p className="chat-archive__lede">
          Restored chats return to the sidebar. Delete removes the thread and
          its messages permanently.
        </p>
        <p className="chat-archive__nav">
          <a href="/chat">← Back to chat</a>
        </p>
      </header>

      {banner ? (
        <p className="chat-archive__banner" role="status">
          {banner}
          <button type="button" onClick={() => setBanner(null)}>
            Dismiss
          </button>
        </p>
      ) : null}

      {loading ? (
        <p className="chat-archive__empty">Loading…</p>
      ) : chats.length === 0 ? (
        <p className="chat-archive__empty">No archived chats.</p>
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
                  className="chat-archive__btn"
                  onClick={() => void restore(chat.id)}
                >
                  Restore
                </button>
                <button
                  type="button"
                  className="chat-archive__btn chat-archive__btn--danger"
                  onClick={() => void remove(chat.id, chat.title)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

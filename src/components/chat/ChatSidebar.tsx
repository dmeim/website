import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Library,
  MessageCirclePlus,
  ScrollText,
  Search,
  Trash2,
  X,
} from "lucide";
import type { ChatSummary } from "@/lib/chat/types";
import { LucideIcon } from "./LucideIcon";

type ChatSidebarProps = {
  chats: ChatSummary[];
  activeChatId: string | null;
  view: "chat" | "library";
  busy?: boolean;
  streaming?: boolean;
  generatingChatIds?: Set<string>;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onOpenLibrary: () => void;
  onArchiveChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
};

export function ChatSidebar({
  chats,
  activeChatId,
  view,
  busy = false,
  streaming = false,
  generatingChatIds,
  onNewChat,
  onSelectChat,
  onOpenLibrary,
  onArchiveChat,
  onDeleteChat,
}: ChatSidebarProps) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => c.title.toLowerCase().includes(q));
  }, [chats, query]);

  return (
    <aside className="chat-sidebar" aria-label="Chat navigation">
      <div className="chat-sidebar__top">
        <button
          type="button"
          className={
            view === "chat" && !activeChatId
              ? "chat-sidebar__primary is-active"
              : "chat-sidebar__primary"
          }
          onClick={onNewChat}
          disabled={busy || streaming}
        >
          <LucideIcon icon={MessageCirclePlus} size={16} />
          New chat
        </button>
        <button
          type="button"
          className={
            view === "library"
              ? "chat-sidebar__nav is-active"
              : "chat-sidebar__nav"
          }
          onClick={onOpenLibrary}
        >
          <LucideIcon icon={Library} size={16} />
          Library
        </button>
        <button
          type="button"
          className="chat-sidebar__nav is-disabled"
          disabled
          aria-disabled="true"
          title="Skills coming later"
        >
          <LucideIcon icon={ScrollText} size={16} />
          Skills
        </button>
      </div>

      <div className="chat-sidebar__section">
        <div className="chat-sidebar__section-head">
          {searchOpen ? (
            <div className="chat-sidebar__search-field">
              <label className="visually-hidden" htmlFor="chat-sidebar-search">
                Search chats
              </label>
              <input
                ref={searchInputRef}
                id="chat-sidebar-search"
                type="search"
                className="chat-sidebar__search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search chats…"
                autoComplete="off"
              />
              <button
                type="button"
                className="chat-sidebar__search-close"
                onMouseDown={(event) => event.preventDefault()}
                onClick={closeSearch}
                aria-label="Close search"
                title="Close"
              >
                <LucideIcon icon={X} size={16} />
              </button>
            </div>
          ) : (
            <>
              <h2 className="chat-sidebar__heading">Chats</h2>
              <button
                type="button"
                className="chat-sidebar__search-btn"
                onClick={() => setSearchOpen(true)}
                aria-label="Search chats"
                title="Search chats"
              >
                <LucideIcon icon={Search} size={16} />
              </button>
            </>
          )}
        </div>
        <ul className="chat-sidebar__list">
          {filtered.length === 0 ? (
            <li className="chat-sidebar__empty">
              {chats.length === 0 ? "No chats yet" : "No matching chats"}
            </li>
          ) : (
            filtered.map((chat) => {
              const isGenerating =
                Boolean(chat.generatingAt) ||
                Boolean(generatingChatIds?.has(chat.id));
              return (
                <li key={chat.id} className="chat-sidebar__item">
                  <button
                    type="button"
                    className={
                      chat.id === activeChatId && view === "chat"
                        ? "chat-sidebar__chat is-active"
                        : "chat-sidebar__chat"
                    }
                    onClick={() => onSelectChat(chat.id)}
                    aria-busy={isGenerating || undefined}
                  >
                    {isGenerating ? (
                      <span
                        className="chat-sidebar__gen-dot"
                        title="Generating"
                        aria-label="Generating"
                      />
                    ) : null}
                    <span className="chat-sidebar__chat-title">{chat.title}</span>
                  </button>
                  <div className="chat-sidebar__actions">
                    <button
                      type="button"
                      className="chat-sidebar__action"
                      onClick={() => onArchiveChat(chat.id)}
                      aria-label={`Archive ${chat.title}`}
                      title="Archive"
                    >
                      <LucideIcon icon={Archive} size={14} />
                    </button>
                    <button
                      type="button"
                      className="chat-sidebar__action chat-sidebar__action--danger"
                      onClick={() => onDeleteChat(chat.id)}
                      aria-label={`Delete ${chat.title}`}
                      title="Delete"
                    >
                      <LucideIcon icon={Trash2} size={14} />
                    </button>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <div className="chat-sidebar__foot">
        <a className="chat-sidebar__nav" href="/chat/archive">
          <LucideIcon icon={Archive} size={16} />
          Archive
        </a>
      </div>
    </aside>
  );
}

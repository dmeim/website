import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatSummary } from "@/lib/chat/types";
import { bindNavMarker } from "@/ui/lib/nav-marker";
import { Button, EmptyState, IconButton, Input, List, ListRow } from "@/ui/react";

type ChatSidebarProps = {
  chats: ChatSummary[];
  activeChatId: string | null;
  view: "chat" | "library" | "archive";
  busy?: boolean;
  streaming?: boolean;
  generatingChatIds?: Set<string>;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onOpenLibrary: () => void;
  onOpenArchive: () => void;
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
  onOpenArchive,
  onArchiveChat,
  onDeleteChat,
}: ChatSidebarProps) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const chatsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    const el = chatsRef.current;
    return el ? bindNavMarker(el) : undefined;
  }, []);

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
    <div className="chat-sidebar">
      <div className="chat-sidebar__top">
        <Button
          variant="primary"
          iconStart="note-pencil"
          fullWidth
          className="chat-sidebar__new"
          pressed={view === "chat" && !activeChatId ? true : undefined}
          onClick={onNewChat}
          disabled={busy || streaming}
        >
          New chat
        </Button>
        <List divided={false} density="compact" className="chat-sidebar__nav" label="Chat sections">
          <ListRow
            icon="books"
            title="Library"
            current={view === "library"}
            arrow={false}
            onSelect={onOpenLibrary}
          />
          <ListRow icon="scroll" title="Skills" description="Coming later" disabled arrow={false} onSelect={() => {}} />
        </List>
      </div>

      <div className="chat-sidebar__section">
        <div className="chat-sidebar__section-head">
          {searchOpen ? (
            <div className="chat-sidebar__search-field">
              <Input
                ref={searchInputRef}
                id="chat-sidebar-search"
                type="search"
                size="sm"
                label="Search chats"
                labelHidden
                iconStart="magnifying-glass"
                clearable={false}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search chats…"
                autoComplete="off"
              />
              <IconButton
                icon="x"
                label="Close search"
                size="sm"
                tooltip={false}
                onMouseDown={(event) => event.preventDefault()}
                onClick={closeSearch}
              />
            </div>
          ) : (
            <>
              <h2 className="chat-sidebar__heading">Chats</h2>
              <IconButton
                icon="magnifying-glass"
                label="Search chats"
                size="sm"
                onClick={() => setSearchOpen(true)}
              />
            </>
          )}
        </div>
        <div className="chat-sidebar__chats" ref={chatsRef} data-ui-nav-marker="">
          <span className="ui-nav-marker" data-axis="y" data-visible="false" aria-hidden="true" />
          {filtered.length === 0 ? (
            <EmptyState size="sm" title={chats.length === 0 ? "No chats yet" : "No matching chats"} />
          ) : (
            <List density="compact" className="chat-sidebar__list" label="Chats" data-ui-marker-rail="">
              {filtered.map((chat) => {
                const isGenerating = Boolean(chat.generatingAt) || Boolean(generatingChatIds?.has(chat.id));
                const isCurrent = chat.id === activeChatId && view === "chat";
                return (
                  <ListRow
                    key={chat.id}
                    className="chat-sidebar__chat"
                    title={chat.title}
                    arrow={false}
                    aria-current={isCurrent ? "page" : undefined}
                    data-ui-marker-target=""
                    status={isGenerating ? { status: "busy", label: "Generating", labelHidden: true } : undefined}
                    onSelect={() => onSelectChat(chat.id)}
                    actions={
                      <>
                        <IconButton
                          icon="archive"
                          label={`Archive ${chat.title}`}
                          size="sm"
                          tooltip={false}
                          title="Archive"
                          onClick={() => onArchiveChat(chat.id)}
                        />
                        <IconButton
                          icon="trash"
                          label={`Delete ${chat.title}`}
                          size="sm"
                          tooltip={false}
                          title="Delete"
                          className="chat-sidebar__delete"
                          onClick={() => onDeleteChat(chat.id)}
                        />
                      </>
                    }
                  />
                );
              })}
            </List>
          )}
        </div>
      </div>

      <List divided={false} density="compact" className="chat-sidebar__foot" label="Archived chats">
        <ListRow icon="archive" title="Archive" current={view === "archive"} arrow={false} onSelect={onOpenArchive} />
      </List>
    </div>
  );
}

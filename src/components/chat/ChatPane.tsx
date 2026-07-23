import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import type { UIMessage } from "ai";
import { File, Images, Library, Plus, Send, X } from "lucide";
import type { GoModelInfo, LibraryAssetSummary } from "@/lib/chat/types";
import { LibraryPickerModal } from "./LibraryPickerModal";
import { LucideIcon } from "./LucideIcon";
import MarkdownBody from "./MarkdownBody";
import { ModelPicker } from "./ModelPicker";
import { attachmentsOf, textFromParts } from "./messageUtils";

type ChatPaneProps = {
  title: string;
  models: GoModelInfo[];
  modelId: string;
  messages: UIMessage[];
  input: string;
  pendingAttachments: LibraryAssetSummary[];
  libraryAssets: LibraryAssetSummary[];
  libraryLoading?: boolean;
  loadingThread: boolean;
  streaming: boolean;
  /** Server or client still producing a reply (may be after navigate-away). */
  generating?: boolean;
  busy: boolean;
  errorMessage?: string | null;
  canRetry?: boolean;
  canRegenerate?: boolean;
  canExport?: boolean;
  canFork?: boolean;
  onOpenSidebar: () => void;
  onModelChange: (modelId: string) => void;
  onInputChange: (value: string) => void;
  onSubmit: (event?: FormEvent) => void;
  onStop: () => void;
  onRetry?: () => void;
  onRegenerate?: () => void;
  onExport?: () => void;
  onFork?: (messageId?: string) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  onDismissError?: () => void;
  onPickImages: () => void;
  onPickFiles: () => void;
  onRefreshLibrary: () => Promise<void>;
  onAttachFromLibrary: (assets: LibraryAssetSummary[]) => void;
  onRemoveAttachment: (id: string) => void;
  threadRef: RefObject<HTMLDivElement | null>;
  threadEndRef: RefObject<HTMLDivElement | null>;
  composerRef: RefObject<HTMLTextAreaElement | null>;
};

export function ChatPane({
  title,
  models,
  modelId,
  messages,
  input,
  pendingAttachments,
  libraryAssets,
  libraryLoading = false,
  loadingThread,
  streaming,
  generating = false,
  busy,
  errorMessage = null,
  canRetry = false,
  canRegenerate = false,
  canExport = false,
  canFork = false,
  onOpenSidebar,
  onModelChange,
  onInputChange,
  onSubmit,
  onStop,
  onRetry,
  onRegenerate,
  onExport,
  onFork,
  onEditMessage,
  onDismissError,
  onPickImages,
  onPickFiles,
  onRefreshLibrary,
  onAttachFromLibrary,
  onRemoveAttachment,
  threadRef,
  threadEndRef,
  composerRef,
}: ChatPaneProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const attachMenuRef = useRef<HTMLDivElement | null>(null);
  const attachMenuId = useId();

  useEffect(() => {
    if (!attachMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!attachMenuRef.current?.contains(target)) {
        setAttachMenuOpen(false);
      }
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setAttachMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [attachMenuOpen]);

  const openLibraryPicker = () => {
    setAttachMenuOpen(false);
    setLibraryModalOpen(true);
    void onRefreshLibrary();
  };

  useLayoutEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input, composerRef]);

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onSubmit();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  const composerBusy = streaming || generating;
  const showStop = streaming || generating;
  const actionsEnabled = canFork && !composerBusy && !busy;

  const startEdit = (messageId: string, content: string) => {
    setEditingId(messageId);
    setEditDraft(content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft("");
  };

  const saveEdit = () => {
    if (!editingId || !onEditMessage) return;
    const next = editDraft.trim();
    if (!next) return;
    onEditMessage(editingId, next);
    cancelEdit();
  };

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
          <h1 className="chat-main__title">{title}</h1>
          <ModelPicker
            models={models}
            value={modelId}
            onChange={onModelChange}
            disabled={composerBusy}
          />
        </div>
        <div className="chat-main__header-actions">
          {canFork && onFork ? (
            <button
              type="button"
              className="chat-btn chat-btn--ghost"
              onClick={() => onFork()}
              disabled={!actionsEnabled}
              title="Fork this chat (full history)"
            >
              Fork
            </button>
          ) : null}
          {canExport ? (
            <button
              type="button"
              className="chat-btn chat-btn--ghost chat-main__export"
              onClick={onExport}
              disabled={busy || composerBusy}
            >
              Export
            </button>
          ) : null}
        </div>
      </header>

      {errorMessage ? (
        <div className="chat-main__error" role="alert">
          <p>{errorMessage}</p>
          <div className="chat-main__error-actions">
            {canRetry && onRetry ? (
              <button type="button" className="chat-btn" onClick={onRetry}>
                Retry
              </button>
            ) : null}
            {onDismissError ? (
              <button
                type="button"
                className="chat-btn chat-btn--ghost"
                onClick={onDismissError}
              >
                Dismiss
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="chat-thread" ref={threadRef} aria-live="polite">
        {loadingThread ? (
          <p className="chat-empty">Loading…</p>
        ) : messages.length === 0 ? (
          <div className="chat-empty chat-empty--hero">
            <p className="chat-empty__brand">dmeim chat</p>
            <p>
              Private OpenCode Go session. Default model is DeepSeek V4 Flash —
              pick another from the header when you need it.
            </p>
            <p className="chat-empty__hints">
              Shortcuts: ⌘/Ctrl+Shift+O new chat · Esc stop / close menu · ⌘/Ctrl+Enter
              send. Attach: images ≤4MiB inlined; text/PDF extracted when possible;
              video/other sent as filename notes.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const text = textFromParts(message);
            const isUser = message.role === "user";
            const isLastAssistant =
              !isUser &&
              index === messages.length - 1 &&
              message.role === "assistant";
            const attachments = attachmentsOf(message);
            const isEditing = editingId === message.id;
            return (
              <article
                key={message.id}
                className={
                  isUser
                    ? "chat-bubble chat-bubble--user"
                    : "chat-bubble chat-bubble--assistant"
                }
              >
                <header className="chat-bubble__role">
                  <span>{isUser ? "You" : "Assistant"}</span>
                  <div className="chat-bubble__actions">
                    {isLastAssistant && canRegenerate && onRegenerate && !composerBusy ? (
                      <button
                        type="button"
                        className="chat-bubble__action"
                        onClick={onRegenerate}
                      >
                        Regenerate
                      </button>
                    ) : null}
                    {actionsEnabled && onFork ? (
                      <button
                        type="button"
                        className="chat-bubble__action"
                        onClick={() => onFork(message.id)}
                      >
                        Fork here
                      </button>
                    ) : null}
                    {actionsEnabled && isUser && onEditMessage && !isEditing ? (
                      <button
                        type="button"
                        className="chat-bubble__action"
                        onClick={() => startEdit(message.id, text)}
                      >
                        Edit
                      </button>
                    ) : null}
                  </div>
                </header>
                {isEditing ? (
                  <div className="chat-bubble__edit">
                    <textarea
                      className="chat-bubble__edit-input"
                      rows={4}
                      value={editDraft}
                      onChange={(event) => setEditDraft(event.target.value)}
                      aria-label="Edit message"
                    />
                    <div className="chat-bubble__edit-actions">
                      <button
                        type="button"
                        className="chat-btn"
                        onClick={saveEdit}
                        disabled={!editDraft.trim()}
                      >
                        Save &amp; branch
                      </button>
                      <button
                        type="button"
                        className="chat-btn chat-btn--ghost"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="chat-bubble__edit-hint">
                      Creates a new chat from this point with your edit. The
                      original chat stays unchanged.
                    </p>
                  </div>
                ) : isUser ? (
                  <p className="chat-bubble__text">{text}</p>
                ) : (
                  <MarkdownBody className="chat-bubble__md" text={text} />
                )}
                {attachments.length > 0 && !isEditing ? (
                  <ul className="chat-bubble__attachments">
                    {attachments.map((a) => (
                      <li key={a.id}>
                        {a.filename}
                        <span className="chat-bubble__attach-kind">
                          {a.kind === "image"
                            ? " · image (inlined ≤4MiB)"
                            : a.kind === "pdf"
                              ? " · PDF (text extract when possible)"
                              : a.kind === "video"
                                ? " · video (filename note only)"
                                : a.contentType.startsWith("text/") ||
                                    a.contentType === "application/json"
                                  ? " · text extract"
                                  : " · filename note"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            );
          })
        )}
        {generating && !streaming ? (
          <p className="chat-generating" role="status" aria-live="polite">
            <span className="chat-generating__spinner" aria-hidden="true" />
            Generating…
          </p>
        ) : null}
        <div ref={threadEndRef} />
      </div>

      <form className="chat-composer" onSubmit={onSubmit}>
        {pendingAttachments.length > 0 ? (
          <ul className="chat-composer__attachments">
            {pendingAttachments.map((attachment) => (
              <li key={attachment.id}>
                <span>{attachment.filename}</span>
                <button
                  type="button"
                  aria-label={`Remove ${attachment.filename}`}
                  onClick={() => onRemoveAttachment(attachment.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="chat-composer__row">
          <div className="chat-composer__attach" ref={attachMenuRef}>
            <button
              type="button"
              className="chat-btn chat-btn--ghost chat-btn--icon"
              onClick={() => setAttachMenuOpen((open) => !open)}
              disabled={busy || composerBusy}
              aria-label={attachMenuOpen ? "Close attach menu" : "Attach"}
              aria-expanded={attachMenuOpen}
              aria-controls={attachMenuId}
              title="Attach images, files, or library items"
            >
              <LucideIcon icon={attachMenuOpen ? X : Plus} size={24} />
            </button>
            {attachMenuOpen ? (
              <div
                id={attachMenuId}
                className="chat-attach-menu"
                role="menu"
                aria-label="Attach"
              >
                <button
                  type="button"
                  className="chat-attach-menu__item"
                  role="menuitem"
                  onClick={() => {
                    setAttachMenuOpen(false);
                    onPickImages();
                  }}
                >
                  <LucideIcon icon={Images} size={20} />
                  <span>Images</span>
                </button>
                <button
                  type="button"
                  className="chat-attach-menu__item"
                  role="menuitem"
                  onClick={() => {
                    setAttachMenuOpen(false);
                    onPickFiles();
                  }}
                >
                  <LucideIcon icon={File} size={20} />
                  <span>Files</span>
                </button>
                <button
                  type="button"
                  className="chat-attach-menu__item"
                  role="menuitem"
                  onClick={openLibraryPicker}
                >
                  <LucideIcon icon={Library} size={20} />
                  <span>From library</span>
                </button>
              </div>
            ) : null}
          </div>
          <textarea
            ref={composerRef}
            className="chat-composer__input"
            rows={1}
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onComposerKeyDown}
            placeholder="Message…"
            disabled={busy && !composerBusy}
          />
          {showStop ? (
            <button type="button" className="chat-btn" onClick={onStop}>
              Stop
            </button>
          ) : (
            <button
              type="submit"
              className="chat-btn chat-btn--icon"
              disabled={
                busy ||
                generating ||
                (!input.trim() && pendingAttachments.length === 0)
              }
              aria-label="Send"
              title="Send"
            >
              <LucideIcon icon={Send} size={24} />
            </button>
          )}
        </div>
      </form>

      {libraryModalOpen ? (
        <LibraryPickerModal
          assets={libraryAssets}
          pendingIds={new Set(pendingAttachments.map((a) => a.id))}
          loading={libraryLoading}
          onClose={() => setLibraryModalOpen(false)}
          onConfirm={(selected) => {
            onAttachFromLibrary(selected);
            setLibraryModalOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

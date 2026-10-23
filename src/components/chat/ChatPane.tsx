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
import {
  Brain,
  File,
  Images,
  Library,
  Plus,
  Send,
  Wrench,
  X,
} from "lucide";
import type { ChatProviderId } from "@/lib/chat/thinking";
import type {
  ChatMcpSettings,
  GoModelInfo,
  LibraryAssetSummary,
  McpServerId,
  ThinkingLevel,
} from "@/lib/chat/types";
import { ComposerStatusBar } from "./ComposerStatusBar";
import {
  Badge,
  Button,
  EmptyState,
  IconButton,
  Input,
  Notice,
  Spinner,
  Textarea,
  Toolbar,
} from "@/ui/react";
import { LibraryPickerModal } from "./LibraryPickerModal";
import { LucideIcon } from "./LucideIcon";
import MarkdownBody from "./MarkdownBody";
import { McpSettingsPanel } from "./McpSettingsPanel";
import { ModelSettingsPanel } from "./ModelSettingsPanel";
import { MessageMetrics } from "./MessageMetrics";
import { ThinkingBlock } from "./ThinkingBlock";
import {
  attachmentsOf,
  generationOf,
  isHollowAssistant,
  reasoningFromParts,
  textFromParts,
  toolCallsFromParts,
} from "./messageUtils";

type ChatPaneProps = {
  title: string;
  models: GoModelInfo[];
  modelId: string;
  chatProvider: ChatProviderId;
  thinkingLevel: ThinkingLevel;
  mcpSettings: ChatMcpSettings;
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
  /** Persisted chats only — hide rename for ephemeral draft "New chat". */
  canRename?: boolean;
  onOpenSidebar: () => void;
  onModelChange: (modelId: string) => void;
  onChatProviderChange: (provider: ChatProviderId) => void;
  onThinkingChange: (level: ThinkingLevel) => void;
  onMcpSettingsChange: (settings: ChatMcpSettings) => void;
  onRenameTitle?: (title: string) => void | Promise<void>;
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
  /** Reader has scrolled away from the live reply. */
  showJumpToLatest?: boolean;
  onJumpToLatest?: () => void;
  threadRef: RefObject<HTMLDivElement | null>;
  threadEndRef: RefObject<HTMLDivElement | null>;
  composerRef: RefObject<HTMLTextAreaElement | null>;
};

export function ChatPane({
  title,
  models,
  modelId,
  chatProvider,
  thinkingLevel,
  mcpSettings,
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
  canRename = false,
  onOpenSidebar,
  onModelChange,
  onChatProviderChange,
  onThinkingChange,
  onMcpSettingsChange,
  onRenameTitle,
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
  showJumpToLatest = false,
  onJumpToLatest,
  threadRef,
  threadEndRef,
  composerRef,
}: ChatPaneProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [mcpMenuOpen, setMcpMenuOpen] = useState(false);
  const [mcpDetailServerId, setMcpDetailServerId] =
    useState<McpServerId | null>(null);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const attachMenuRef = useRef<HTMLDivElement | null>(null);
  const modelMenuRef = useRef<HTMLDivElement | null>(null);
  const mcpMenuRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const titleSaveGuardRef = useRef(false);
  const attachMenuId = useId();
  const modelMenuId = useId();
  const mcpMenuId = useId();

  const closeComposerMenus = () => {
    setAttachMenuOpen(false);
    setModelMenuOpen(false);
    setMcpMenuOpen(false);
    setMcpDetailServerId(null);
  };

  useEffect(() => {
    if (!renaming) setTitleDraft(title);
  }, [title, renaming]);

  useEffect(() => {
    if (!canRename && renaming) {
      setRenaming(false);
      setTitleDraft(title);
    }
  }, [canRename, renaming, title]);

  useLayoutEffect(() => {
    if (!renaming) return;
    const el = titleInputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [renaming]);

  useEffect(() => {
    if (!attachMenuOpen && !modelMenuOpen && !mcpMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (attachMenuOpen && !attachMenuRef.current?.contains(target)) {
        setAttachMenuOpen(false);
      }
      if (modelMenuOpen && !modelMenuRef.current?.contains(target)) {
        setModelMenuOpen(false);
      }
      if (mcpMenuOpen && !mcpMenuRef.current?.contains(target)) {
        setMcpMenuOpen(false);
        setMcpDetailServerId(null);
      }
    };
    // Capture + stopImmediate so ChatShell Esc-to-stop does not also fire.
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      closeComposerMenus();
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [attachMenuOpen, modelMenuOpen, mcpMenuOpen]);

  const openLibraryPicker = () => {
    closeComposerMenus();
    setLibraryModalOpen(true);
    void onRefreshLibrary();
  };

  useLayoutEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input, composerRef]);

  const handleComposerSubmit = (event?: FormEvent) => {
    closeComposerMenus();
    onSubmit(event);
  };

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleComposerSubmit();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleComposerSubmit();
    }
  };

  // Announce completion once instead of live-narrating the reply as it streams:
  // an aria-live region around the thread re-reads the whole growing message.
  const [announcement, setAnnouncement] = useState("");
  const wasGeneratingRef = useRef(false);

  useEffect(() => {
    const isGenerating = streaming || generating;
    const wasGenerating = wasGeneratingRef.current;
    wasGeneratingRef.current = isGenerating;
    if (!wasGenerating || isGenerating) return;
    setAnnouncement("Response complete");
    const timer = window.setTimeout(() => setAnnouncement(""), 2000);
    return () => window.clearTimeout(timer);
  }, [streaming, generating]);

  const composerBusy = streaming || generating;
  const showStop = streaming || generating;
  const menusLocked = busy || composerBusy;
  const lastMessage = messages[messages.length - 1];
  const lastHasVisibleAssistantBody =
    lastMessage?.role === "assistant" && !isHollowAssistant(lastMessage);
  /** Spinner while waiting, or during stream until first visible tokens. */
  const showGeneratingStatus = generating && !lastHasVisibleAssistantBody;
  const assistantGenerations = messages
    .filter((message) => message.role === "assistant")
    .map((message) => generationOf(message));
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

  const startRename = () => {
    if (!canRename || !onRenameTitle) return;
    titleSaveGuardRef.current = false;
    setTitleDraft(title);
    setRenaming(true);
  };

  const cancelRename = () => {
    titleSaveGuardRef.current = true;
    setRenaming(false);
    setTitleDraft(title);
  };

  const commitRename = async () => {
    if (!onRenameTitle) {
      cancelRename();
      return;
    }
    const next = titleDraft.trim();
    if (!next) {
      cancelRename();
      return;
    }
    titleSaveGuardRef.current = true;
    setRenaming(false);
    if (next === title) {
      setTitleDraft(title);
      return;
    }
    setTitleDraft(next);
    try {
      await onRenameTitle(next);
    } catch {
      setTitleDraft(title);
    }
  };

  const onTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void commitRename();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelRename();
    }
  };

  const onTitleBlur = () => {
    if (titleSaveGuardRef.current) {
      titleSaveGuardRef.current = false;
      return;
    }
    const next = titleDraft.trim();
    if (!next) {
      cancelRename();
      return;
    }
    void commitRename();
  };

  return (
    <>
      <header className="chat-main__header">
        <IconButton
          icon="list"
          label="Open sidebar"
          tooltip={false}
          className="chat-main__menu"
          onClick={onOpenSidebar}
        />
        <div className="chat-main__title-block">
          {renaming ? (
            <div className="chat-main__title-edit">
              <Input
                ref={titleInputRef}
                className="chat-main__title-input"
                size="sm"
                label="Chat title"
                labelHidden
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                onKeyDown={onTitleKeyDown}
                onBlur={onTitleBlur}
                maxLength={120}
              />
              <div className="chat-main__title-actions">
                <IconButton
                  icon="check"
                  label="Save title"
                  size="sm"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void commitRename()}
                />
                <IconButton
                  icon="x"
                  label="Cancel rename"
                  size="sm"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={cancelRename}
                />
              </div>
            </div>
          ) : (
            <div className="chat-main__title-row">
              <h1 className="chat-main__title" title={title}>
                {title}
              </h1>
            </div>
          )}
        </div>
        <Toolbar label="Chat actions" className="chat-main__header-actions">
          {canRename && onRenameTitle && !renaming ? (
            <IconButton
              icon="pencil-simple"
              label="Rename chat"
              size="sm"
              onClick={startRename}
            />
          ) : null}
          {canFork && onFork ? (
            <IconButton
              icon="git-fork"
              label="Fork chat"
              size="sm"
              onClick={() => onFork()}
              disabled={!actionsEnabled}
            />
          ) : null}
          {canExport ? (
            <IconButton
              icon="download-simple"
              label="Export"
              size="sm"
              onClick={onExport}
              disabled={busy || composerBusy}
            />
          ) : null}
        </Toolbar>
      </header>

      {errorMessage ? (
        <Notice
          className="chat-main__error"
          tone="danger"
          variant="callout"
          role="alert"
          live="assertive"
          actions={
            canRetry || onDismissError ? (
              <>
                {canRetry && onRetry ? (
                  <Button size="sm" iconStart="arrows-clockwise" onClick={onRetry}>
                    Retry
                  </Button>
                ) : null}
                {onDismissError ? (
                  <Button size="sm" variant="ghost" onClick={onDismissError}>
                    Dismiss
                  </Button>
                ) : null}
              </>
            ) : undefined
          }
        >
          {errorMessage}
        </Notice>
      ) : null}

      <p className="ui-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>

      <div className="chat-thread" ref={threadRef}>
        {loadingThread ? (
          <p className="chat-thread__status">
            <Spinner size="sm" />
            Loading…
          </p>
        ) : messages.length === 0 ? (
          <EmptyState
            className="chat-thread__empty"
            size="lg"
            icon="chat-circle"
            title="dmeim chat"
            description={
              <>
                <p>
                  Private OpenCode Go session. Default model is DeepSeek V4
                  Flash — pick another from the thinking control below when you
                  need it.
                </p>
                <p className="chat-thread__hints">
                  Shortcuts: ⌘/Ctrl+Shift+O new chat · Esc stop / close menu ·
                  ⌘/Ctrl+Enter send. Attach: images ≤4MiB inlined; text/PDF
                  extracted when possible; video/other sent as filename notes.
                </p>
              </>
            }
          />
        ) : (
          messages.map((message, index) => {
            const isUser = message.role === "user";
            const text = textFromParts(message);
            const thinking = !isUser ? reasoningFromParts(message) : null;
            const toolCalls = !isUser ? toolCallsFromParts(message) : [];
            const isLastMessage = index === messages.length - 1;
            // Skip hollow assistant placeholders — generating status covers UX.
            if (!isUser && isHollowAssistant(message)) {
              return null;
            }
            const attachments = attachmentsOf(message);
            const isEditing = editingId === message.id;
            const showRegenerate =
              isLastMessage &&
              canRegenerate &&
              Boolean(onRegenerate) &&
              !composerBusy;
            const showForkHere = actionsEnabled && Boolean(onFork);
            const showEdit =
              actionsEnabled && isUser && Boolean(onEditMessage) && !isEditing;
            const statusActions =
              showEdit || showRegenerate || showForkHere ? (
                <>
                  {showEdit ? (
                    <IconButton
                      icon="pencil-simple"
                      label="Edit message"
                      size="sm"
                      onClick={() => startEdit(message.id, text)}
                    />
                  ) : null}
                  {showRegenerate ? (
                    <IconButton
                      icon="arrows-clockwise"
                      label="Regenerate"
                      size="sm"
                      onClick={onRegenerate}
                    />
                  ) : null}
                  {showForkHere ? (
                    <IconButton
                      icon="git-fork"
                      label="Fork here"
                      size="sm"
                      onClick={() => onFork?.(message.id)}
                    />
                  ) : null}
                </>
              ) : null;
            return (
              <article
                key={message.id}
                className="chat-message"
                data-role={isUser ? "user" : "assistant"}
              >
                {isEditing ? (
                  <div className="chat-message__edit">
                    <Textarea
                      label="Edit message"
                      labelHidden
                      rows={4}
                      value={editDraft}
                      onChange={(event) => setEditDraft(event.target.value)}
                      hint="Creates a new chat from this point with your edit. The original chat stays unchanged."
                    />
                    <div className="chat-message__edit-actions">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={saveEdit}
                        disabled={!editDraft.trim()}
                      >
                        Save &amp; branch
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : isUser ? (
                  <>
                    <p className="chat-message__text">{text}</p>
                    <MessageMetrics actions={statusActions} />
                  </>
                ) : (
                  <>
                    {thinking ? (
                      <ThinkingBlock
                        text={thinking.text}
                        streaming={thinking.streaming}
                      />
                    ) : null}
                    {toolCalls.length > 0 ? (
                      <ul className="chat-tool-chips" aria-label="Tools used">
                        {toolCalls.map((chip) => (
                          <li key={chip.key}>
                            <Badge
                              className={`chat-tool-chip chat-tool-chip--${chip.state}`}
                              size="sm"
                              icon={chip.state === "error" ? "warning" : "wrench"}
                              tone={
                                chip.state === "error"
                                  ? "danger"
                                  : chip.state === "pending"
                                    ? "accent"
                                    : "neutral"
                              }
                            >
                              {chip.label}
                              {chip.state === "pending" ? "…" : null}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {text.trim() ? (
                      <MarkdownBody text={text} />
                    ) : null}
                    <MessageMetrics
                      generation={generationOf(message)}
                      actions={statusActions}
                    />
                  </>
                )}
                {attachments.length > 0 && !isEditing ? (
                  <ul className="chat-message__attachments">
                    {attachments.map((a) => (
                      <li key={a.id}>
                        {a.filename}
                        <span className="chat-message__attach-kind">
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
        {showGeneratingStatus ? (
          <p className="chat-thread__status" role="status" aria-live="polite">
            <Spinner size="sm" label="Generating" />
            <span aria-hidden="true">Generating…</span>
          </p>
        ) : null}
        <div ref={threadEndRef} />
      </div>

      <form className="chat-composer" onSubmit={handleComposerSubmit}>
        {showJumpToLatest && onJumpToLatest ? (
          <IconButton
            icon="arrow-down"
            label="Jump to latest"
            variant="secondary"
            tooltip={false}
            className="chat-jump"
            onClick={onJumpToLatest}
          />
        ) : null}
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
        <ComposerStatusBar
          models={models}
          modelId={modelId}
          chatProvider={chatProvider}
          thinkingLevel={thinkingLevel}
          generations={assistantGenerations}
        />
        <div className="chat-composer__row">
          <div className="chat-composer__attach" ref={modelMenuRef}>
            <button
              type="button"
              className="chat-btn chat-btn--ghost chat-btn--icon"
              onClick={() => {
                setModelMenuOpen((open) => !open);
                setAttachMenuOpen(false);
                setMcpMenuOpen(false);
                setMcpDetailServerId(null);
              }}
              disabled={menusLocked && !modelMenuOpen}
              aria-label={
                modelMenuOpen ? "Close model settings" : "Model settings"
              }
              aria-expanded={modelMenuOpen}
              aria-controls={modelMenuId}
              title="Provider, model, and thinking level"
            >
              <LucideIcon icon={modelMenuOpen ? X : Brain} size={24} />
            </button>
            {modelMenuOpen ? (
              <div
                id={modelMenuId}
                className="chat-attach-menu chat-attach-menu--settings"
                role="dialog"
                aria-label="Model settings"
              >
                <ModelSettingsPanel
                  models={models}
                  chatProvider={chatProvider}
                  modelId={modelId}
                  thinkingLevel={thinkingLevel}
                  disabled={menusLocked}
                  onChatProviderChange={onChatProviderChange}
                  onModelChange={onModelChange}
                  onThinkingChange={onThinkingChange}
                />
              </div>
            ) : null}
          </div>
          <div className="chat-composer__attach" ref={mcpMenuRef}>
            <button
              type="button"
              className="chat-btn chat-btn--ghost chat-btn--icon"
              onClick={() => {
                setMcpMenuOpen((open) => {
                  if (open) setMcpDetailServerId(null);
                  return !open;
                });
                setModelMenuOpen(false);
                setAttachMenuOpen(false);
              }}
              disabled={menusLocked && !mcpMenuOpen}
              aria-label={mcpMenuOpen ? "Close MCP tools" : "MCP tools"}
              aria-expanded={mcpMenuOpen}
              aria-controls={mcpMenuId}
              title="MCP tools (Exa, Context7)"
            >
              <LucideIcon icon={mcpMenuOpen ? X : Wrench} size={24} />
            </button>
            {mcpMenuOpen ? (
              <div
                id={mcpMenuId}
                className="chat-attach-menu chat-attach-menu--settings"
                role="dialog"
                aria-label="MCP tools"
              >
                <McpSettingsPanel
                  settings={mcpSettings}
                  disabled={menusLocked}
                  detailServerId={mcpDetailServerId}
                  onDetailServerIdChange={setMcpDetailServerId}
                  onChange={onMcpSettingsChange}
                />
              </div>
            ) : null}
          </div>
          <div className="chat-composer__attach" ref={attachMenuRef}>
            <button
              type="button"
              className="chat-btn chat-btn--ghost chat-btn--icon"
              onClick={() => {
                setAttachMenuOpen((open) => !open);
                setModelMenuOpen(false);
                setMcpMenuOpen(false);
                setMcpDetailServerId(null);
              }}
              disabled={menusLocked && !attachMenuOpen}
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

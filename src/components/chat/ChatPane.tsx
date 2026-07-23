import type { FormEvent, KeyboardEvent, RefObject } from "react";
import type { UIMessage } from "ai";
import type { GoModelInfo, LibraryAssetSummary } from "@/lib/chat/types";
import MarkdownBody from "./MarkdownBody";
import { ModelPicker } from "./ModelPicker";
import { textFromParts } from "./messageUtils";

type ChatPaneProps = {
  title: string;
  models: GoModelInfo[];
  modelId: string;
  messages: UIMessage[];
  input: string;
  pendingAttachments: LibraryAssetSummary[];
  loadingThread: boolean;
  streaming: boolean;
  /** Server or client still producing a reply (may be after navigate-away). */
  generating?: boolean;
  busy: boolean;
  errorMessage?: string | null;
  canRetry?: boolean;
  canRegenerate?: boolean;
  canExport?: boolean;
  onOpenSidebar: () => void;
  onModelChange: (modelId: string) => void;
  onInputChange: (value: string) => void;
  onSubmit: (event?: FormEvent) => void;
  onStop: () => void;
  onRetry?: () => void;
  onRegenerate?: () => void;
  onExport?: () => void;
  onDismissError?: () => void;
  onAttachClick: () => void;
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
  loadingThread,
  streaming,
  generating = false,
  busy,
  errorMessage = null,
  canRetry = false,
  canRegenerate = false,
  canExport = false,
  onOpenSidebar,
  onModelChange,
  onInputChange,
  onSubmit,
  onStop,
  onRetry,
  onRegenerate,
  onExport,
  onDismissError,
  onAttachClick,
  onRemoveAttachment,
  threadRef,
  threadEndRef,
  composerRef,
}: ChatPaneProps) {
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
              send
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
                  {isLastAssistant && canRegenerate && onRegenerate && !composerBusy ? (
                    <button
                      type="button"
                      className="chat-bubble__regen"
                      onClick={onRegenerate}
                    >
                      Regenerate
                    </button>
                  ) : null}
                </header>
                {isUser ? (
                  <p className="chat-bubble__text">{text}</p>
                ) : (
                  <MarkdownBody className="chat-bubble__md" text={text} />
                )}
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
          <button
            type="button"
            className="chat-btn chat-btn--ghost"
            onClick={onAttachClick}
            disabled={busy || composerBusy}
            aria-label="Attach file"
          >
            Attach
          </button>
          <textarea
            ref={composerRef}
            className="chat-composer__input"
            rows={2}
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
              className="chat-btn"
              disabled={
                busy ||
                generating ||
                (!input.trim() && pendingAttachments.length === 0)
              }
            >
              Send
            </button>
          )}
        </div>
      </form>
    </>
  );
}

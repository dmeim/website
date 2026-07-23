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
  onOpenSidebar: () => void;
  onModelChange: (modelId: string) => void;
  onInputChange: (value: string) => void;
  onSubmit: (event?: FormEvent) => void;
  onStop: () => void;
  onAttachClick: () => void;
  onRemoveAttachment: (id: string) => void;
  threadEndRef: RefObject<HTMLDivElement | null>;
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
  onOpenSidebar,
  onModelChange,
  onInputChange,
  onSubmit,
  onStop,
  onAttachClick,
  onRemoveAttachment,
  threadEndRef,
}: ChatPaneProps) {
  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  const composerBusy = streaming || generating;

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
      </header>

      <div className="chat-thread" aria-live="polite">
        {loadingThread ? (
          <p className="chat-empty">Loading…</p>
        ) : messages.length === 0 ? (
          <div className="chat-empty chat-empty--hero">
            <p className="chat-empty__brand">dmeim chat</p>
            <p>
              Private OpenCode Go session. Default model is DeepSeek V4 Flash —
              pick another from the header when you need it.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const text = textFromParts(message);
            const isUser = message.role === "user";
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
                  {isUser ? "You" : "Assistant"}
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
            className="chat-composer__input"
            rows={2}
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onComposerKeyDown}
            placeholder="Message…"
            disabled={busy && !composerBusy}
          />
          {streaming ? (
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

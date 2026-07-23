import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { DEFAULT_CHAT_MODEL_ID } from "@/lib/chat/constants";
import type {
  ChatSummary,
  GoModelInfo,
  LibraryAssetSummary,
} from "@/lib/chat/types";
import {
  createChat,
  deleteChat,
  deleteLibraryAsset,
  fetchChat,
  fetchChats,
  fetchLibrary,
  fetchModels,
  patchChat,
  uploadLibraryFile,
} from "./api";
import { ChatPane } from "./ChatPane";
import { ChatSidebar } from "./ChatSidebar";
import { LibraryPane } from "./LibraryPane";
import { dtoToUiMessages, textFromParts } from "./messageUtils";
import "./ChatShell.css";

type ViewMode = "chat" | "library";

type Props = {
  initialChatId?: string | null;
};

const POLL_MS = 1500;
const POST_IDLE_POLLS = 2;

function lastMessageIsUser(messages: { role: string }[]): boolean {
  const last = messages[messages.length - 1];
  return last?.role === "user";
}

export default function ChatShell({ initialChatId = null }: Props) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [models, setModels] = useState<GoModelInfo[]>([]);
  const [assets, setAssets] = useState<LibraryAssetSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(
    initialChatId,
  );
  const [activeChat, setActiveChat] = useState<ChatSummary | null>(null);
  const [view, setView] = useState<ViewMode>("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<
    LibraryAssetSummary[]
  >([]);
  const [modelId, setModelId] = useState(DEFAULT_CHAT_MODEL_ID);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  /** Chats we expect an assistant reply for (local + server generating). */
  const [awaitingByChat, setAwaitingByChat] = useState<Record<string, boolean>>(
    {},
  );

  const activeChatIdRef = useRef(activeChatId);
  const modelIdRef = useRef(modelId);
  const pendingIdsRef = useRef<string[]>([]);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesRef = useRef<UIMessage[]>([]);
  const awaitingRef = useRef(awaitingByChat);
  const streamingRef = useRef(false);
  const idlePollsLeftRef = useRef(0);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);
  useEffect(() => {
    modelIdRef.current = modelId;
  }, [modelId]);
  useEffect(() => {
    pendingIdsRef.current = pendingAttachments.map((a) => a.id);
  }, [pendingAttachments]);
  useEffect(() => {
    awaitingRef.current = awaitingByChat;
  }, [awaitingByChat]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages }) => {
          const lastUser = [...messages]
            .reverse()
            .find((m) => m.role === "user");
          const text = lastUser ? textFromParts(lastUser) : "";
          return {
            body: {
              chatId: activeChatIdRef.current,
              message: text,
              modelId: modelIdRef.current,
              attachmentIds: pendingIdsRef.current,
            },
          };
        },
      }),
    [],
  );

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    error,
    clearError,
  } = useChat({
    id: "dmeim-chat-shell",
    transport,
    onFinish: async () => {
      setPendingAttachments([]);
      const id = activeChatIdRef.current;
      if (id) {
        setAwaitingByChat((prev) => ({ ...prev, [id]: false }));
      }
      try {
        const list = await fetchChats(false);
        setChats(list);
        if (id) {
          const found = list.find((c) => c.id === id);
          if (found) setActiveChat(found);
        }
      } catch {
        // ignore refresh errors
      }
    },
  });

  messagesRef.current = messages;

  const streaming = status === "submitted" || status === "streaming";
  streamingRef.current = streaming;

  const markAwaiting = useCallback((id: string, awaiting: boolean) => {
    setAwaitingByChat((prev) => {
      if (!!prev[id] === awaiting) return prev;
      return { ...prev, [id]: awaiting };
    });
  }, []);

  const refreshChats = useCallback(async () => {
    const list = await fetchChats(false);
    setChats(list);
    for (const chat of list) {
      if (chat.generatingAt) {
        markAwaiting(chat.id, true);
      }
    }
    return list;
  }, [markAwaiting]);

  const refreshLibrary = useCallback(async () => {
    const list = await fetchLibrary();
    setAssets(list);
    return list;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [chatList, modelPayload] = await Promise.all([
          fetchChats(false),
          fetchModels(),
        ]);
        if (cancelled) return;
        setChats(chatList);
        for (const chat of chatList) {
          if (chat.generatingAt) {
            markAwaiting(chat.id, true);
          }
        }
        setModels(modelPayload.models);
        if (modelPayload.defaultModelId) {
          setModelId((prev) =>
            prev === DEFAULT_CHAT_MODEL_ID
              ? modelPayload.defaultModelId
              : prev,
          );
        }
      } catch (err) {
        if (!cancelled) {
          setBanner(
            err instanceof Error ? err.message : "Failed to load chat data",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [markAwaiting]);

  useEffect(() => {
    if (view !== "library") return;
    let cancelled = false;
    (async () => {
      try {
        const list = await refreshLibrary();
        if (!cancelled) setAssets(list);
      } catch (err) {
        if (!cancelled) {
          setBanner(
            err instanceof Error ? err.message : "Failed to load library",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [view, refreshLibrary]);

  const selectChat = useCallback(
    async (id: string | null, opts?: { replaceUrl?: boolean }) => {
      // Abort any in-flight stream so status returns to ready (avoids stuck Send).
      // Server-side consumeStream still finishes and persists the assistant turn.
      void stop();
      clearError();
      setBusy(false);
      setView("chat");
      setSidebarOpen(false);
      setPendingAttachments([]);
      setBanner(null);
      idlePollsLeftRef.current = 0;

      if (!id) {
        setActiveChatId(null);
        setActiveChat(null);
        setMessages([]);
        setModelId(DEFAULT_CHAT_MODEL_ID);
        if (opts?.replaceUrl !== false) {
          window.history.replaceState({}, "", "/chat");
        }
        return;
      }

      setLoadingThread(true);
      setActiveChatId(id);
      window.history.replaceState({}, "", `/chat?c=${encodeURIComponent(id)}`);

      try {
        const { chat, messages: rows } = await fetchChat(id);
        setActiveChat(chat);
        setModelId(chat.modelId || DEFAULT_CHAT_MODEL_ID);
        setMessages(dtoToUiMessages(rows));
        if (chat.generatingAt) {
          markAwaiting(id, true);
          idlePollsLeftRef.current = POST_IDLE_POLLS;
        } else if (lastMessageIsUser(rows) && awaitingRef.current[id]) {
          idlePollsLeftRef.current = POST_IDLE_POLLS;
        }
      } catch (err) {
        setBanner(err instanceof Error ? err.message : "Failed to load chat");
        setMessages([]);
      } finally {
        setLoadingThread(false);
      }
    },
    [clearError, markAwaiting, setMessages, stop],
  );

  const returnToActiveChat = useCallback(() => {
    setView("chat");
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (initialChatId) {
      void selectChat(initialChatId, { replaceUrl: false });
    }
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streaming]);

  const needsPoll =
    Object.values(awaitingByChat).some(Boolean) ||
    chats.some((c) => c.generatingAt);

  // Poll chat list + active thread while any chat is generating / awaiting.
  useEffect(() => {
    if (!needsPoll) {
      return;
    }

    let cancelled = false;

    const tick = async () => {
      try {
        const list = await fetchChats(false);
        if (cancelled) return;
        setChats(list);

        const generatingIds = new Set(
          list.filter((c) => c.generatingAt).map((c) => c.id),
        );

        setAwaitingByChat((prev) => {
          let changed = false;
          const next = { ...prev };
          const activeId = activeChatIdRef.current;
          for (const id of Object.keys(next)) {
            // Clear non-active chats once the server marks them idle.
            if (next[id] && !generatingIds.has(id) && id !== activeId) {
              next[id] = false;
              changed = true;
            }
          }
          for (const id of generatingIds) {
            if (!next[id]) {
              next[id] = true;
              changed = true;
            }
          }
          return changed ? next : prev;
        });

        const id = activeChatIdRef.current;
        if (!id) return;

        const summary = list.find((c) => c.id === id) ?? null;
        if (summary) {
          setActiveChat(summary);
        }

        const serverGenerating = Boolean(summary?.generatingAt);
        const shouldRefreshThread =
          serverGenerating ||
          Boolean(awaitingRef.current[id]) ||
          idlePollsLeftRef.current > 0 ||
          lastMessageIsUser(messagesRef.current);

        // While the live client stream is active, don't clobber tokens from D1.
        if (!shouldRefreshThread || streamingRef.current) {
          return;
        }

        const { chat, messages: rows } = await fetchChat(id);
        if (cancelled || activeChatIdRef.current !== id) return;

        setActiveChat(chat);
        // Server is source of truth — replace local thread to avoid duplicates.
        setMessages(dtoToUiMessages(rows));

        const hasAssistantReply = !lastMessageIsUser(rows);
        if (hasAssistantReply) {
          markAwaiting(id, false);
          idlePollsLeftRef.current = 0;
        } else if (chat.generatingAt) {
          markAwaiting(id, true);
          idlePollsLeftRef.current = POST_IDLE_POLLS;
        } else if (idlePollsLeftRef.current > 0) {
          idlePollsLeftRef.current -= 1;
        } else {
          markAwaiting(id, false);
        }
      } catch {
        // ignore transient poll errors
      }
    };

    void tick();
    const handle = window.setInterval(() => void tick(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [needsPoll, markAwaiting, setMessages]);

  const handleNewChat = async () => {
    setBusy(true);
    setBanner(null);
    try {
      const chat = await createChat({ modelId });
      await refreshChats();
      await selectChat(chat.id);
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Could not create chat");
    } finally {
      setBusy(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await patchChat(id, { archived: true });
      const list = await refreshChats();
      if (activeChatId === id) {
        const next = list[0]?.id ?? null;
        await selectChat(next);
      }
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Archive failed");
    }
  };

  const handleDeleteChat = async (id: string) => {
    if (!window.confirm("Delete this chat permanently?")) return;
    try {
      await deleteChat(id);
      const list = await refreshChats();
      if (activeChatId === id) {
        const next = list[0]?.id ?? null;
        await selectChat(next);
      }
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleModelChange = async (next: string) => {
    setModelId(next);
    if (!activeChatId) return;
    try {
      const chat = await patchChat(activeChatId, { modelId: next });
      setActiveChat(chat);
      setChats((prev) => prev.map((c) => (c.id === chat.id ? chat : c)));
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Could not update model");
    }
  };

  const ensureChat = async (): Promise<string> => {
    if (activeChatId) return activeChatId;
    const chat = await createChat({ modelId });
    await refreshChats();
    setActiveChatId(chat.id);
    setActiveChat(chat);
    activeChatIdRef.current = chat.id;
    window.history.replaceState(
      {},
      "",
      `/chat?c=${encodeURIComponent(chat.id)}`,
    );
    return chat.id;
  };

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    const text = input.trim();
    if ((!text && pendingAttachments.length === 0) || streaming || busy) {
      return;
    }
    setBusy(true);
    setBanner(null);
    clearError();
    try {
      const chatId = await ensureChat();
      markAwaiting(chatId, true);
      idlePollsLeftRef.current = POST_IDLE_POLLS;
      const optimisticAt = new Date().toISOString();
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? { ...c, generatingAt: c.generatingAt ?? optimisticAt }
            : c,
        ),
      );
      setActiveChat((prev) =>
        prev && prev.id === chatId
          ? { ...prev, generatingAt: prev.generatingAt ?? optimisticAt }
          : prev,
      );
      setInput("");
      const outbound =
        text ||
        (pendingAttachments.length
          ? `(Attached ${pendingAttachments.length} file${pendingAttachments.length === 1 ? "" : "s"})`
          : "");
      const sendPromise = sendMessage({ text: outbound });
      // prepareSendMessagesRequest already read pendingIdsRef; clear chips now.
      setPendingAttachments([]);
      pendingIdsRef.current = [];
      await sendPromise;
    } catch (err) {
      const id = activeChatIdRef.current;
      if (id) markAwaiting(id, false);
      setBanner(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setBanner(null);
    try {
      const uploaded: LibraryAssetSummary[] = [];
      for (const file of Array.from(files)) {
        uploaded.push(await uploadLibraryFile(file));
      }
      setPendingAttachments((prev) => [...prev, ...uploaded]);
      if (view === "library") {
        await refreshLibrary();
      }
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAsset = async (asset: LibraryAssetSummary) => {
    try {
      await deleteLibraryAsset(asset.id);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      setPendingAttachments((prev) => prev.filter((a) => a.id !== asset.id));
    } catch (err) {
      const refs =
        err && typeof err === "object" && "referencingChats" in err
          ? (
              err as {
                referencingChats?: { id: string; title: string }[];
              }
            ).referencingChats
          : undefined;
      if (refs?.length) {
        setBanner(
          `Still used in: ${refs.map((c) => c.title).join(", ")}. Detach or delete those chats first.`,
        );
      } else {
        setBanner(err instanceof Error ? err.message : "Delete failed");
      }
    }
  };

  const attachFromLibrary = (asset: LibraryAssetSummary) => {
    setPendingAttachments((prev) =>
      prev.some((a) => a.id === asset.id) ? prev : [...prev, asset],
    );
    setView("chat");
    setBanner(`Attached “${asset.filename}” to the next message.`);
  };

  const showGeneratingIndicator =
    view === "chat" &&
    Boolean(activeChatId) &&
    !loadingThread &&
    (streaming ||
      Boolean(activeChat?.generatingAt) ||
      Boolean(activeChatId && awaitingByChat[activeChatId])) &&
    (streaming || lastMessageIsUser(messages));

  const generatingChatIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of chats) {
      if (c.generatingAt) ids.add(c.id);
    }
    for (const [id, awaiting] of Object.entries(awaitingByChat)) {
      if (awaiting) ids.add(id);
    }
    return ids;
  }, [chats, awaitingByChat]);

  return (
    <div
      className="chat-shell"
      data-sidebar-open={sidebarOpen ? "true" : "false"}
    >
      <button
        type="button"
        className="chat-shell__backdrop"
        aria-label="Close sidebar"
        onClick={() => setSidebarOpen(false)}
      />

      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        view={view}
        busy={busy}
        streaming={streaming}
        generatingChatIds={generatingChatIds}
        onNewChat={() => void handleNewChat()}
        onSelectChat={(id) => {
          if (id === activeChatId && view !== "chat") {
            returnToActiveChat();
            return;
          }
          void selectChat(id);
        }}
        onOpenLibrary={() => {
          // Keep client stream alive when possible; server also continues.
          setView("library");
          setSidebarOpen(false);
        }}
        onArchiveChat={(id) => void handleArchive(id)}
        onDeleteChat={(id) => void handleDeleteChat(id)}
      />

      <section className="chat-main" aria-label="Chat workspace">
        {banner || error ? (
          <p className="chat-main__banner" role="status">
            {banner || error?.message}
            <button
              type="button"
              onClick={() => {
                setBanner(null);
                clearError();
              }}
            >
              Dismiss
            </button>
          </p>
        ) : null}

        {view === "library" ? (
          <LibraryPane
            assets={assets}
            busy={busy}
            onOpenSidebar={() => setSidebarOpen(true)}
            onUploadClick={() => fileInputRef.current?.click()}
            onAttach={attachFromLibrary}
            onDelete={(asset) => void handleDeleteAsset(asset)}
          />
        ) : (
          <ChatPane
            title={activeChat?.title ?? "New chat"}
            models={models}
            modelId={modelId}
            messages={messages}
            input={input}
            pendingAttachments={pendingAttachments}
            loadingThread={loadingThread}
            streaming={streaming}
            generating={showGeneratingIndicator}
            busy={busy}
            onOpenSidebar={() => setSidebarOpen(true)}
            onModelChange={(next) => void handleModelChange(next)}
            onInputChange={setInput}
            onSubmit={(event) => void handleSubmit(event)}
            onStop={() => stop()}
            onAttachClick={() => fileInputRef.current?.click()}
            onRemoveAttachment={(id) =>
              setPendingAttachments((prev) => prev.filter((a) => a.id !== id))
            }
            threadEndRef={threadEndRef}
          />
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="visually-hidden"
          multiple
          onChange={(event) => void handleUpload(event.target.files)}
        />
      </section>
    </div>
  );
}

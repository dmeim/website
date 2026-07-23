import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
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

  const activeChatIdRef = useRef(activeChatId);
  const modelIdRef = useRef(modelId);
  const pendingIdsRef = useRef<string[]>([]);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);
  useEffect(() => {
    modelIdRef.current = modelId;
  }, [modelId]);
  useEffect(() => {
    pendingIdsRef.current = pendingAttachments.map((a) => a.id);
  }, [pendingAttachments]);

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
      try {
        const list = await fetchChats(false);
        setChats(list);
        if (activeChatIdRef.current) {
          const found = list.find((c) => c.id === activeChatIdRef.current);
          if (found) setActiveChat(found);
        }
      } catch {
        // ignore refresh errors
      }
    },
  });

  const streaming = status === "submitted" || status === "streaming";

  const refreshChats = useCallback(async () => {
    const list = await fetchChats(false);
    setChats(list);
    return list;
  }, []);

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
  }, []);

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
      } catch (err) {
        setBanner(err instanceof Error ? err.message : "Failed to load chat");
        setMessages([]);
      } finally {
        setLoadingThread(false);
      }
    },
    [clearError, setMessages, stop],
  );

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
      await ensureChat();
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
        onNewChat={() => void handleNewChat()}
        onSelectChat={(id) => void selectChat(id)}
        onOpenLibrary={() => {
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

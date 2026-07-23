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
import type { ChatProviderId } from "@/lib/chat/thinking";
import {
  coerceThinkingLevel,
  isThinkingLevel,
} from "@/lib/chat/thinking";
import type {
  ChatMcpSettings,
  ChatSummary,
  GoModelInfo,
  LibraryAssetSummary,
  ThinkingLevel,
} from "@/lib/chat/types";
import { defaultMcpSettings, parseMcpSettings } from "@/lib/chat/mcp/settings";
import {
  chatExportUrl,
  createChat,
  deleteChat,
  deleteLibraryAsset,
  fetchChat,
  fetchChats,
  fetchLibrary,
  fetchModels,
  forkChat,
  patchChat,
  stopChat,
  uploadLibraryFile,
} from "./api";
import { ArchivePane } from "./ArchivePane";
import { ChatPane } from "./ChatPane";
import { ChatSidebar } from "./ChatSidebar";
import { LibraryPane } from "./LibraryPane";
import {
  dtoToUiMessages,
  isHollowAssistant,
  shouldPreferLocalThread,
  textFromParts,
} from "./messageUtils";
import "./ChatShell.css";

type ViewMode = "chat" | "library" | "archive";

type Props = {
  initialChatId?: string | null;
};

const POLL_MS = 1500;
const POST_IDLE_POLLS = 2;
const NEAR_BOTTOM_PX = 120;
/** Client-only belt-and-suspenders if server generating_at is stuck (no server TTL). */
const STALE_GENERATING_MS = 15 * 60 * 1000;

function ageOutStaleGenerating(chats: ChatSummary[]): ChatSummary[] {
  const now = Date.now();
  let changed = false;
  const next = chats.map((c) => {
    if (!c.generatingAt) return c;
    const started = Date.parse(c.generatingAt);
    if (!Number.isFinite(started) || now - started < STALE_GENERATING_MS) {
      return c;
    }
    changed = true;
    return { ...c, generatingAt: null };
  });
  return changed ? next : chats;
}

function lastMessageIsUser(messages: { role: string }[]): boolean {
  const last = messages[messages.length - 1];
  return last?.role === "user";
}

function lastMessageIsAssistant(messages: { role: string }[]): boolean {
  const last = messages[messages.length - 1];
  return last?.role === "assistant";
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

export default function ChatShell({ initialChatId = null }: Props) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [archivedChats, setArchivedChats] = useState<ChatSummary[]>([]);
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
  const [chatProvider, setChatProvider] =
    useState<ChatProviderId>("opencode-go");
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>("off");
  const [mcpSettings, setMcpSettings] = useState<ChatMcpSettings>(() =>
    defaultMcpSettings(),
  );
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const setBannerRef = useRef(setBanner);
  setBannerRef.current = setBanner;
  const [archiveBanner, setArchiveBanner] = useState<string | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  /** Chats we expect an assistant reply for (local + server generating). */
  const [awaitingByChat, setAwaitingByChat] = useState<Record<string, boolean>>(
    {},
  );

  const activeChatIdRef = useRef(activeChatId);
  const modelIdRef = useRef(modelId);
  const thinkingLevelRef = useRef(thinkingLevel);
  const mcpSettingsRef = useRef(mcpSettings);
  const pendingIdsRef = useRef<string[]>([]);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesRef = useRef<UIMessage[]>([]);
  const awaitingRef = useRef(awaitingByChat);
  const streamingRef = useRef(false);
  const idlePollsLeftRef = useRef(0);
  const stickToBottomRef = useRef(true);
  /** Chat id pinned for the in-flight send/regenerate body (not live active id). */
  const sendChatIdRef = useRef<string | null>(null);
  /** Monotonic generation so stale selectChat fetches can't clear newer loads. */
  const selectChatGenRef = useRef(0);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);
  useEffect(() => {
    modelIdRef.current = modelId;
  }, [modelId]);
  useEffect(() => {
    thinkingLevelRef.current = thinkingLevel;
  }, [thinkingLevel]);
  useEffect(() => {
    mcpSettingsRef.current = mcpSettings;
  }, [mcpSettings]);
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
        fetch: async (input, init) => {
          const res = await globalThis.fetch(input, init);
          const mcpNote = res.headers.get("X-Chat-Mcp-Notes");
          if (mcpNote) setBannerRef.current(mcpNote);
          return res;
        },
        prepareSendMessagesRequest: ({ messages, trigger }) => {
          const chatId =
            sendChatIdRef.current ?? activeChatIdRef.current ?? undefined;
          if (trigger === "regenerate-message") {
            return {
              body: {
                chatId,
                modelId: modelIdRef.current,
                thinkingLevel: thinkingLevelRef.current,
                mcpSettings: mcpSettingsRef.current,
                regenerate: true,
              },
            };
          }
          const lastUser = [...messages]
            .reverse()
            .find((m) => m.role === "user");
          const text = lastUser ? textFromParts(lastUser) : "";
          return {
            body: {
              chatId,
              message: text,
              modelId: modelIdRef.current,
              thinkingLevel: thinkingLevelRef.current,
              mcpSettings: mcpSettingsRef.current,
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
    regenerate,
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
    onError: (err) => {
      const id = activeChatIdRef.current;
      if (id) {
        setAwaitingByChat((prev) => ({ ...prev, [id]: false }));
        setActiveChat((prev) =>
          prev && prev.id === id
            ? { ...prev, generatingAt: null, lastError: err.message }
            : prev,
        );
        setChats((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, generatingAt: null, lastError: err.message }
              : c,
          ),
        );
      }
      setBanner(err.message);
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
    setLibraryLoading(true);
    try {
      const list = await fetchLibrary();
      setAssets(list);
      return list;
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  const refreshArchive = useCallback(async () => {
    setArchiveLoading(true);
    try {
      const list = await fetchChats(true);
      setArchivedChats(list);
      return list;
    } finally {
      setArchiveLoading(false);
    }
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

  useEffect(() => {
    if (view !== "archive") return;
    let cancelled = false;
    (async () => {
      try {
        const list = await refreshArchive();
        if (!cancelled) setArchivedChats(list);
      } catch (err) {
        if (!cancelled) {
          setArchiveBanner(
            err instanceof Error ? err.message : "Failed to load archive",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [view, refreshArchive]);

  const selectChat = useCallback(
    async (id: string | null, opts?: { replaceUrl?: boolean }) => {
      // Abort any in-flight *client* stream so status returns to ready.
      // Server-side consumeStream still finishes and persists the assistant turn
      // unless the user explicitly hits Stop (which calls /stop).
      const gen = ++selectChatGenRef.current;
      void stop();
      clearError();
      setBusy(false);
      setView("chat");
      setSidebarOpen(false);
      setPendingAttachments([]);
      setBanner(null);
      idlePollsLeftRef.current = 0;
      stickToBottomRef.current = true;

      if (!id) {
        setActiveChatId(null);
        setActiveChat(null);
        setMessages([]);
        setModelId(DEFAULT_CHAT_MODEL_ID);
        setThinkingLevel("off");
        setChatProvider("opencode-go");
        setMcpSettings(defaultMcpSettings());
        if (opts?.replaceUrl !== false) {
          window.history.replaceState({}, "", "/chat");
        }
        if (selectChatGenRef.current === gen) {
          setLoadingThread(false);
        }
        return;
      }

      setLoadingThread(true);
      setActiveChatId(id);
      window.history.replaceState({}, "", `/chat?c=${encodeURIComponent(id)}`);

      try {
        const { chat, messages: rows } = await fetchChat(id);
        if (selectChatGenRef.current !== gen || activeChatIdRef.current !== id) {
          return;
        }
        setActiveChat(chat);
        const nextModel = chat.modelId || DEFAULT_CHAT_MODEL_ID;
        setModelId(nextModel);
        setChatProvider("opencode-go");
        setThinkingLevel((prev) => coerceThinkingLevel(nextModel, prev));
        setMcpSettings(parseMcpSettings(chat.mcpSettings));
        setMessages(dtoToUiMessages(rows));
        if (chat.lastError) {
          setBanner(chat.lastError);
        }
        if (chat.generatingAt) {
          markAwaiting(id, true);
          idlePollsLeftRef.current = POST_IDLE_POLLS;
        } else if (lastMessageIsUser(rows) && awaitingRef.current[id]) {
          idlePollsLeftRef.current = POST_IDLE_POLLS;
        }
      } catch (err) {
        if (selectChatGenRef.current !== gen || activeChatIdRef.current !== id) {
          return;
        }
        setBanner(err instanceof Error ? err.message : "Failed to load chat");
        setMessages([]);
      } finally {
        if (selectChatGenRef.current === gen) {
          setLoadingThread(false);
        }
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

  // Track whether the user is following the live reply (near bottom).
  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottomRef.current = distance < NEAR_BOTTOM_PX;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [activeChatId, view, loadingThread]);

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
        const list = ageOutStaleGenerating(await fetchChats(false));
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
          if (summary.lastError && !streamingRef.current) {
            setBanner((prev) => prev ?? summary.lastError);
          }
        }

        const serverGenerating = Boolean(summary?.generatingAt);
        const shouldRefreshThread =
          serverGenerating ||
          Boolean(awaitingRef.current[id]) ||
          idlePollsLeftRef.current > 0 ||
          lastMessageIsUser(messagesRef.current);

        if (!shouldRefreshThread || streamingRef.current) {
          return;
        }

        const { chat, messages: rows } = await fetchChat(id);
        if (cancelled || activeChatIdRef.current !== id) return;

        setActiveChat(chat);

        // Don't wipe a local assistant that D1 hasn't persisted yet.
        if (shouldPreferLocalThread(messagesRef.current, rows)) {
          if (chat.generatingAt) {
            markAwaiting(id, true);
            idlePollsLeftRef.current = POST_IDLE_POLLS;
          } else if (idlePollsLeftRef.current > 0) {
            idlePollsLeftRef.current -= 1;
          }
          return;
        }

        // Server is source of truth once it has caught up.
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
    // Draft mode only — persist on first send via ensureChat().
    if (!activeChatId && view === "chat" && messages.length === 0) {
      setInput("");
      setPendingAttachments([]);
      setBanner(null);
      clearError();
      setSidebarOpen(false);
      composerRef.current?.focus();
      return;
    }
    setBusy(false);
    setBanner(null);
    clearError();
    setInput("");
    await selectChat(null);
    composerRef.current?.focus();
  };

  const handleRenameTitle = async (nextTitle: string) => {
    const id = activeChatIdRef.current;
    if (!id) return;
    const trimmed = nextTitle.trim();
    if (!trimmed) return;
    try {
      const chat = await patchChat(id, { title: trimmed });
      setActiveChat(chat);
      setChats((prev) => prev.map((c) => (c.id === chat.id ? chat : c)));
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Could not rename chat");
      throw err;
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await patchChat(id, { archived: true });
      const list = await refreshChats();
      if (view === "archive") {
        await refreshArchive();
      }
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

  const handleRestoreArchived = async (id: string) => {
    try {
      await patchChat(id, { archived: false });
      await Promise.all([refreshChats(), refreshArchive()]);
      setArchiveBanner("Chat restored.");
    } catch (err) {
      setArchiveBanner(err instanceof Error ? err.message : "Restore failed");
    }
  };

  const handleDeleteArchived = async (id: string, title: string) => {
    if (!window.confirm(`Permanently delete “${title}”?`)) return;
    try {
      await deleteChat(id);
      await Promise.all([refreshChats(), refreshArchive()]);
      setArchiveBanner(null);
    } catch (err) {
      setArchiveBanner(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleModelChange = async (next: string) => {
    setModelId(next);
    setThinkingLevel((prev) => coerceThinkingLevel(next, prev));
    if (!activeChatId) return;
    try {
      const chat = await patchChat(activeChatId, { modelId: next });
      setActiveChat(chat);
      setChats((prev) => prev.map((c) => (c.id === chat.id ? chat : c)));
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Could not update model");
    }
  };

  const handleChatProviderChange = (next: ChatProviderId) => {
    setChatProvider(next);
    const forProvider = models.filter((m) => m.chatProvider === next);
    if (forProvider.length === 0) return;
    if (!forProvider.some((m) => m.id === modelId)) {
      void handleModelChange(forProvider[0].id);
    }
  };

  const handleThinkingChange = (level: ThinkingLevel) => {
    if (!isThinkingLevel(level)) return;
    setThinkingLevel(coerceThinkingLevel(modelId, level));
  };

  const handleMcpSettingsChange = (next: ChatMcpSettings) => {
    const parsed = parseMcpSettings(next);
    setMcpSettings(parsed);
    mcpSettingsRef.current = parsed;
    if (!activeChatId) return;
    void (async () => {
      try {
        const chat = await patchChat(activeChatId, { mcpSettings: parsed });
        setActiveChat(chat);
        setChats((prev) => prev.map((c) => (c.id === chat.id ? chat : c)));
      } catch (err) {
        setBanner(
          err instanceof Error ? err.message : "Could not update MCP settings",
        );
      }
    })();
  };

  const ensureChat = async (): Promise<string> => {
    if (activeChatId) return activeChatId;
    const chat = await createChat({ modelId, mcpSettings });
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
    stickToBottomRef.current = true;
    try {
      const chatId = await ensureChat();
      sendChatIdRef.current = chatId;
      markAwaiting(chatId, true);
      idlePollsLeftRef.current = POST_IDLE_POLLS;
      const optimisticAt = new Date().toISOString();
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                generatingAt: c.generatingAt ?? optimisticAt,
                lastError: null,
              }
            : c,
        ),
      );
      setActiveChat((prev) =>
        prev && prev.id === chatId
          ? {
              ...prev,
              generatingAt: prev.generatingAt ?? optimisticAt,
              lastError: null,
            }
          : prev,
      );
      setInput("");
      const outbound =
        text ||
        (pendingAttachments.length
          ? `(Attached ${pendingAttachments.length} file${pendingAttachments.length === 1 ? "" : "s"})`
          : "");
      const sendPromise = sendMessage({ text: outbound });
      setPendingAttachments([]);
      pendingIdsRef.current = [];
      await sendPromise;
    } catch (err) {
      const id = sendChatIdRef.current ?? activeChatIdRef.current;
      if (id) markAwaiting(id, false);
      setBanner(err instanceof Error ? err.message : "Send failed");
    } finally {
      sendChatIdRef.current = null;
      setBusy(false);
    }
  };

  const handleStop = async () => {
    const id = activeChatIdRef.current;
    void stop();
    if (!id) return;
    try {
      await stopChat(id);
      markAwaiting(id, false);
      setActiveChat((prev) =>
        prev && prev.id === id ? { ...prev, generatingAt: null } : prev,
      );
      setChats((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, generatingAt: null } : c,
        ),
      );
      // Pull server state (partial assistant may have been persisted).
      idlePollsLeftRef.current = POST_IDLE_POLLS;
      markAwaiting(id, true);
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Stop failed");
    }
  };

  const handleRegenerate = async () => {
    if (!activeChatId || streaming || busy) return;
    if (!lastMessageIsAssistant(messages) && !lastMessageIsUser(messages)) {
      return;
    }
    setBanner(null);
    clearError();
    stickToBottomRef.current = true;
    sendChatIdRef.current = activeChatId;
    markAwaiting(activeChatId, true);
    idlePollsLeftRef.current = POST_IDLE_POLLS;
    try {
      // Drop trailing assistant locally; server truncate happens on regenerate.
      if (lastMessageIsAssistant(messages)) {
        setMessages(messages.slice(0, -1));
      }
      await regenerate();
    } catch (err) {
      markAwaiting(activeChatId, false);
      setBanner(err instanceof Error ? err.message : "Regenerate failed");
    } finally {
      sendChatIdRef.current = null;
    }
  };

  const handleRetry = async () => {
    setBanner(null);
    clearError();
    if (lastMessageIsUser(messages)) {
      await handleRegenerate();
      return;
    }
    if (lastMessageIsAssistant(messages)) {
      await handleRegenerate();
    }
  };

  const handleExport = () => {
    if (!activeChatId) return;
    window.open(chatExportUrl(activeChatId), "_blank", "noopener,noreferrer");
  };

  const handleFork = async (messageId?: string) => {
    if (!activeChatId || streaming || busy) return;
    setBusy(true);
    setBanner(null);
    try {
      const { chat } = await forkChat(
        activeChatId,
        messageId ? { messageId } : undefined,
      );
      await refreshChats();
      await selectChat(chat.id);
      setBanner(
        messageId
          ? "Forked from that message into a new chat."
          : "Forked into a new chat.",
      );
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Fork failed");
    } finally {
      setBusy(false);
    }
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    if (!activeChatId || streaming || busy) return;
    setBusy(true);
    setBanner(null);
    clearError();
    stickToBottomRef.current = true;
    try {
      const { chat } = await forkChat(activeChatId, {
        messageId,
        editContent: content,
      });
      await refreshChats();
      await selectChat(chat.id);
      markAwaiting(chat.id, true);
      idlePollsLeftRef.current = POST_IDLE_POLLS;
      const optimisticAt = new Date().toISOString();
      setChats((prev) =>
        prev.map((c) =>
          c.id === chat.id
            ? {
                ...c,
                generatingAt: c.generatingAt ?? optimisticAt,
                lastError: null,
              }
            : c,
        ),
      );
      setActiveChat((prev) =>
        prev && prev.id === chat.id
          ? {
              ...prev,
              generatingAt: prev.generatingAt ?? optimisticAt,
              lastError: null,
            }
          : prev,
      );
      // Branch ends on the edited user turn — regenerate the assistant reply.
      sendChatIdRef.current = chat.id;
      await regenerate();
      setBanner("Branched edit into a new chat; original unchanged.");
    } catch (err) {
      const id = sendChatIdRef.current ?? activeChatIdRef.current;
      if (id) markAwaiting(id, false);
      setBanner(err instanceof Error ? err.message : "Edit branch failed");
    } finally {
      sendChatIdRef.current = null;
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
      } else {
        setAssets((prev) => {
          const next = [...prev];
          for (const asset of uploaded) {
            if (!next.some((a) => a.id === asset.id)) next.unshift(asset);
          }
          return next;
        });
      }
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
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

  const attachManyFromLibrary = (selected: LibraryAssetSummary[]) => {
    if (!selected.length) return;
    setPendingAttachments((prev) => {
      const next = [...prev];
      for (const asset of selected) {
        if (!next.some((a) => a.id === asset.id)) next.push(asset);
      }
      return next;
    });
    const label =
      selected.length === 1
        ? `Attached “${selected[0].filename}” to the next message.`
        : `Attached ${selected.length} library items to the next message.`;
    setBanner(label);
  };

  const lastMessage = messages[messages.length - 1];
  const showGeneratingIndicator =
    view === "chat" &&
    Boolean(activeChatId) &&
    !loadingThread &&
    (streaming ||
      Boolean(activeChat?.generatingAt) ||
      Boolean(activeChatId && awaitingByChat[activeChatId])) &&
    (streaming ||
      lastMessageIsUser(messages) ||
      (lastMessage != null && isHollowAssistant(lastMessage)));

  // Auto-scroll when generating indicator / messages change (near-bottom only).
  useEffect(() => {
    if (view !== "chat") return;
    if (!stickToBottomRef.current) return;
    threadEndRef.current?.scrollIntoView({
      behavior: streaming ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, streaming, view, showGeneratingIndicator]);

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

  const paneError =
    banner ||
    error?.message ||
    activeChat?.lastError ||
    null;

  const canRetry =
    Boolean(paneError) &&
    Boolean(activeChatId) &&
    !streaming &&
    (lastMessageIsUser(messages) || lastMessageIsAssistant(messages));

  const canRegenerate =
    Boolean(activeChatId) &&
    !streaming &&
    !busy &&
    (lastMessageIsAssistant(messages) ||
      (lastMessageIsUser(messages) && !showGeneratingIndicator));

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;

      if (event.key === "Escape") {
        // ChatPane closes composer menus in capture and preventDefaults;
        // do not also stop generation when a menu handled Esc.
        if (event.defaultPrevented) return;
        if (streaming || showGeneratingIndicator) {
          event.preventDefault();
          void handleStop();
          return;
        }
        if (sidebarOpen) {
          event.preventDefault();
          setSidebarOpen(false);
        }
        return;
      }

      // ⌘/Ctrl+Shift+O — new chat (ChatGPT-like; avoids browser new-window)
      if (mod && event.shiftKey && event.key.toLowerCase() === "o") {
        event.preventDefault();
        void handleNewChat();
        return;
      }

      // ⌘/Ctrl+/ — focus composer
      if (mod && event.key === "/") {
        event.preventDefault();
        setView("chat");
        setSidebarOpen(false);
        composerRef.current?.focus();
        return;
      }

      // "/" focuses composer when not typing elsewhere
      if (
        event.key === "/" &&
        !mod &&
        !event.altKey &&
        !isEditableTarget(event.target)
      ) {
        event.preventDefault();
        setView("chat");
        composerRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // intentionally omit handleNewChat/handleStop — use refs for stable listener
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming, showGeneratingIndicator, sidebarOpen]);

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
        onOpenArchive={() => {
          setView("archive");
          setSidebarOpen(false);
          setArchiveBanner(null);
        }}
        onArchiveChat={(id) => void handleArchive(id)}
        onDeleteChat={(id) => void handleDeleteChat(id)}
      />

      <section className="chat-main" aria-label="Chat workspace">
        {view === "library" ? (
          <LibraryPane
            assets={assets}
            busy={busy}
            onOpenSidebar={() => setSidebarOpen(true)}
            onUploadClick={() => fileInputRef.current?.click()}
            onAttach={attachFromLibrary}
            onDelete={(asset) => void handleDeleteAsset(asset)}
          />
        ) : view === "archive" ? (
          <ArchivePane
            chats={archivedChats}
            loading={archiveLoading}
            busy={busy}
            banner={archiveBanner}
            onOpenSidebar={() => setSidebarOpen(true)}
            onDismissBanner={() => setArchiveBanner(null)}
            onRestore={(id) => void handleRestoreArchived(id)}
            onDelete={(id, title) => void handleDeleteArchived(id, title)}
          />
        ) : (
          <ChatPane
            title={activeChat?.title ?? "New chat"}
            models={models}
            modelId={modelId}
            chatProvider={chatProvider}
            thinkingLevel={thinkingLevel}
            mcpSettings={mcpSettings}
            messages={messages}
            input={input}
            pendingAttachments={pendingAttachments}
            libraryAssets={assets}
            libraryLoading={libraryLoading}
            loadingThread={loadingThread}
            streaming={streaming}
            generating={showGeneratingIndicator}
            busy={busy}
            errorMessage={paneError}
            canRetry={canRetry}
            canRegenerate={canRegenerate}
            canExport={Boolean(activeChatId) && messages.length > 0}
            canFork={Boolean(activeChatId) && messages.length > 0}
            canRename={Boolean(activeChatId)}
            onOpenSidebar={() => setSidebarOpen(true)}
            onModelChange={(next) => void handleModelChange(next)}
            onChatProviderChange={handleChatProviderChange}
            onThinkingChange={handleThinkingChange}
            onMcpSettingsChange={handleMcpSettingsChange}
            onRenameTitle={handleRenameTitle}
            onInputChange={setInput}
            onSubmit={(event) => void handleSubmit(event)}
            onStop={() => void handleStop()}
            onRetry={() => void handleRetry()}
            onRegenerate={() => void handleRegenerate()}
            onExport={handleExport}
            onFork={(messageId) => void handleFork(messageId)}
            onEditMessage={(messageId, content) =>
              void handleEditMessage(messageId, content)
            }
            onDismissError={() => {
              setBanner(null);
              clearError();
              setActiveChat((prev) =>
                prev ? { ...prev, lastError: null } : prev,
              );
            }}
            onPickImages={() => imageInputRef.current?.click()}
            onPickFiles={() => fileInputRef.current?.click()}
            onRefreshLibrary={() => refreshLibrary().then(() => undefined)}
            onAttachFromLibrary={attachManyFromLibrary}
            onRemoveAttachment={(id) =>
              setPendingAttachments((prev) => prev.filter((a) => a.id !== id))
            }
            threadRef={threadRef}
            threadEndRef={threadEndRef}
            composerRef={composerRef}
          />
        )}

        <input
          ref={imageInputRef}
          type="file"
          className="visually-hidden"
          accept="image/*"
          multiple
          onChange={(event) => void handleUpload(event.target.files)}
        />
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

import type {
  ChatMessageDto,
  ChatSummary,
  GoModelInfo,
  LibraryAssetSummary,
} from "@/lib/chat";

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    const err = new Error(
      typeof data.error === "string" ? data.error : `Request failed (${res.status})`,
    ) as Error & { status?: number; data?: unknown };
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function fetchChats(archived = false): Promise<ChatSummary[]> {
  const q = archived ? "?archived=1" : "";
  const data = await readJson<{ chats: ChatSummary[] }>(
    await fetch(`/api/chats${q}`),
  );
  return data.chats;
}

export async function createChat(input?: {
  title?: string;
  modelId?: string;
}): Promise<ChatSummary> {
  const data = await readJson<{ chat: ChatSummary }>(
    await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input ?? {}),
    }),
  );
  return data.chat;
}

export async function fetchChat(
  id: string,
): Promise<{ chat: ChatSummary; messages: ChatMessageDto[] }> {
  return readJson(await fetch(`/api/chats/${encodeURIComponent(id)}`));
}

export async function patchChat(
  id: string,
  patch: { title?: string; modelId?: string; archived?: boolean },
): Promise<ChatSummary> {
  const data = await readJson<{ chat: ChatSummary }>(
    await fetch(`/api/chats/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  );
  return data.chat;
}

export async function deleteChat(id: string): Promise<void> {
  await readJson(await fetch(`/api/chats/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }));
}

export async function fetchModels(): Promise<{
  models: GoModelInfo[];
  defaultModelId: string;
}> {
  const data = await readJson<{
    models: GoModelInfo[];
    defaultModelId?: string;
  }>(await fetch("/api/chat/models"));
  return {
    models: data.models,
    defaultModelId: data.defaultModelId ?? "deepseek-v4-flash",
  };
}

export async function fetchLibrary(): Promise<LibraryAssetSummary[]> {
  const data = await readJson<{ assets: LibraryAssetSummary[] }>(
    await fetch("/api/library"),
  );
  return data.assets;
}

export async function uploadLibraryFile(
  file: File,
): Promise<LibraryAssetSummary> {
  const form = new FormData();
  form.set("file", file);
  const data = await readJson<{ asset: LibraryAssetSummary }>(
    await fetch("/api/library", { method: "POST", body: form }),
  );
  return data.asset;
}

export async function deleteLibraryAsset(id: string): Promise<void> {
  const res = await fetch(`/api/library/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  const data = (await res.json()) as {
    error?: string;
    referencingChats?: { id: string; title: string }[];
  };
  if (!res.ok) {
    const err = new Error(
      data.error ?? `Delete failed (${res.status})`,
    ) as Error & {
      status?: number;
      referencingChats?: { id: string; title: string }[];
    };
    err.status = res.status;
    err.referencingChats = data.referencingChats;
    throw err;
  }
}

export function libraryContentUrl(id: string): string {
  return `/api/library/${encodeURIComponent(id)}/content`;
}

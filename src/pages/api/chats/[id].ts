import type { APIRoute } from "astro";
import {
  chatToSummary,
  deleteChat,
  denyIfAccessRequired,
  getChat,
  getDb,
  getRuntimeEnv,
  json,
  listMessages,
  methodNotAllowed,
  nowIso,
  updateChat,
} from "@/lib/chat";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const env = getRuntimeEnv();
  const denied = denyIfAccessRequired(context.request, env);
  if (denied) return denied;

  const id = context.params.id;
  if (!id) {
    return json({ error: "Missing chat id" }, { status: 400 });
  }

  try {
    const db = getDb(env);
    const row = await getChat(db, id);
    if (!row) {
      return json({ error: "Chat not found" }, { status: 404 });
    }
    const messages = await listMessages(db, id);
    return json({ chat: chatToSummary(row), messages });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load chat";
    return json({ error: message }, { status: 500 });
  }
};

export const PATCH: APIRoute = async (context) => {
  const env = getRuntimeEnv();
  const denied = denyIfAccessRequired(context.request, env);
  if (denied) return denied;

  const id = context.params.id;
  if (!id) {
    return json({ error: "Missing chat id" }, { status: 400 });
  }

  let body: {
    title?: string;
    modelId?: string;
    archived?: boolean;
  } = {};
  try {
    body = (await context.request.json()) as typeof body;
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch: {
    title?: string;
    modelId?: string;
    archivedAt?: string | null;
  } = {};

  if (typeof body.title === "string") {
    patch.title = body.title;
  }
  if (typeof body.modelId === "string" && body.modelId.trim()) {
    patch.modelId = body.modelId.trim();
  }
  if (typeof body.archived === "boolean") {
    patch.archivedAt = body.archived ? nowIso() : null;
  }

  if (
    patch.title === undefined &&
    patch.modelId === undefined &&
    patch.archivedAt === undefined
  ) {
    return json(
      { error: "Provide title, modelId, and/or archived" },
      { status: 400 },
    );
  }

  try {
    const db = getDb(env);
    const chat = await updateChat(db, id, patch);
    if (!chat) {
      return json({ error: "Chat not found" }, { status: 404 });
    }
    return json({ chat });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update chat";
    return json({ error: message }, { status: 500 });
  }
};

export const DELETE: APIRoute = async (context) => {
  const env = getRuntimeEnv();
  const denied = denyIfAccessRequired(context.request, env);
  if (denied) return denied;

  const id = context.params.id;
  if (!id) {
    return json({ error: "Missing chat id" }, { status: 400 });
  }

  try {
    const db = getDb(env);
    const deleted = await deleteChat(db, id);
    if (!deleted) {
      return json({ error: "Chat not found" }, { status: 404 });
    }
    return json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete chat";
    return json({ error: message }, { status: 500 });
  }
};

export const ALL: APIRoute = async () =>
  methodNotAllowed(["GET", "PATCH", "DELETE"]);

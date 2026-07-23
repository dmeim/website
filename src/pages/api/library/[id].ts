import type { APIRoute } from "astro";
import {
  deleteLibraryAsset,
  denyIfAccessRequired,
  getDb,
  getLibraryAsset,
  getLibraryBucket,
  getRuntimeEnv,
  json,
  methodNotAllowed,
  referencingChatsForAsset,
} from "@/lib/chat";

export const prerender = false;

export const DELETE: APIRoute = async (context) => {
  const env = getRuntimeEnv(context);
  const denied = denyIfAccessRequired(context.request, env);
  if (denied) return denied;

  const id = context.params.id;
  if (!id) {
    return json({ error: "Missing asset id" }, { status: 400 });
  }

  try {
    const db = getDb(env);
    const asset = await getLibraryAsset(db, id);
    if (!asset) {
      return json({ error: "Asset not found" }, { status: 404 });
    }

    const refs = await referencingChatsForAsset(db, id);
    if (refs.length > 0) {
      return json(
        {
          error: "Asset is referenced by one or more chats",
          referencingChats: refs,
        },
        { status: 409 },
      );
    }

    const result = await deleteLibraryAsset(db, id);
    if (result === "missing") {
      return json({ error: "Asset not found" }, { status: 404 });
    }
    if (result === "referenced") {
      const again = await referencingChatsForAsset(db, id);
      return json(
        {
          error: "Asset is referenced by one or more chats",
          referencingChats: again,
        },
        { status: 409 },
      );
    }

    try {
      const bucket = getLibraryBucket(env);
      await bucket.delete(asset.r2_key);
    } catch {
      // D1 row already gone; R2 orphan is acceptable residual risk
    }

    return json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete asset";
    return json({ error: message }, { status: 500 });
  }
};

export const ALL: APIRoute = async () => methodNotAllowed(["DELETE"]);

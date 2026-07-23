import type { APIRoute } from "astro";
import {
  denyIfAccessRequired,
  getDb,
  getLibraryAsset,
  getLibraryBucket,
  getRuntimeEnv,
  json,
  methodNotAllowed,
} from "@/lib/chat";

export const prerender = false;

export const GET: APIRoute = async (context) => {
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

    const bucket = getLibraryBucket(env);
    const object = await bucket.get(asset.r2_key);
    if (!object) {
      return json({ error: "Asset content missing" }, { status: 404 });
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      asset.content_type || "application/octet-stream",
    );
    headers.set("Content-Length", String(asset.byte_size));
    headers.set(
      "Content-Disposition",
      `inline; filename="${asset.filename.replace(/"/g, "")}"`,
    );
    headers.set("Cache-Control", "private, max-age=3600");

    return new Response(object.body, { status: 200, headers });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to download asset";
    return json({ error: message }, { status: 500 });
  }
};

export const ALL: APIRoute = async () => methodNotAllowed(["GET"]);

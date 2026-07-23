import type { APIRoute } from "astro";
import {
  denyIfAccessRequired,
  getDb,
  getLibraryBucket,
  getRuntimeEnv,
  insertLibraryAsset,
  json,
  libraryR2Key,
  listLibraryAssets,
  methodNotAllowed,
  newId,
  validateLibraryUpload,
} from "@/lib/chat";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const env = getRuntimeEnv();
  const denied = denyIfAccessRequired(context.request, env);
  if (denied) return denied;

  try {
    const db = getDb(env);
    const assets = await listLibraryAssets(db);
    return json({ assets });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to list library assets";
    return json({ error: message }, { status: 500 });
  }
};

export const POST: APIRoute = async (context) => {
  const env = getRuntimeEnv();
  const denied = denyIfAccessRequired(context.request, env);
  if (denied) return denied;

  let form: FormData;
  try {
    form = await context.request.formData();
  } catch {
    return json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return json({ error: "file field is required" }, { status: 400 });
  }

  const validation = validateLibraryUpload({
    filename: file.name || "file",
    contentType: file.type || "application/octet-stream",
    byteSize: file.size,
  });
  if (!validation.ok) {
    return json({ error: validation.error }, { status: 400 });
  }

  const id = newId();
  const r2Key = libraryR2Key(id, validation.filename);

  try {
    const bucket = getLibraryBucket(env);
    const bytes = await file.arrayBuffer();
    await bucket.put(r2Key, bytes, {
      httpMetadata: {
        contentType: validation.contentType,
      },
    });

    const db = getDb(env);
    const asset = await insertLibraryAsset(db, {
      id,
      r2Key,
      filename: validation.filename,
      contentType: validation.contentType,
      byteSize: file.size,
      kind: validation.kind,
    });

    return json({ asset }, { status: 201 });
  } catch (err) {
    // Best-effort cleanup if D1 insert fails after R2 put
    try {
      const bucket = getLibraryBucket(env);
      await bucket.delete(r2Key);
    } catch {
      // ignore
    }
    const message =
      err instanceof Error ? err.message : "Failed to upload asset";
    return json({ error: message }, { status: 500 });
  }
};

export const ALL: APIRoute = async () => methodNotAllowed(["GET", "POST"]);

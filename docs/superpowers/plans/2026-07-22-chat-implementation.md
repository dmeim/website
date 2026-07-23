# Private AI Chat — Implementation Plan

**Date:** 2026-07-22  
**Spec:** `docs/superpowers/specs/2026-07-22-chat-design.md`  
**Status:** In progress

## Resolved defaults

| Choice | Decision |
| --- | --- |
| Active chat URL | `/chat?c=<chatId>` (and `/chat/archive` for archive) |
| Library UX | Pane mode inside ChatShell (`view=library`), not a separate primary route |
| Abort / partials | Discard incomplete assistant text unless `onFinish` fires |
| Default model | `deepseek-v4-flash` |
| Skills | Stub sidebar item (disabled, `aria-disabled`) |
| Auth | Cloudflare Access on `/chat*`, `/api/chat*`, `/api/chats*`, `/api/library*`; app checks `Cf-Access-Authenticated-User-Email` when present (defense in depth; skip check in local dev when header absent) |

## Architecture snapshot

- Astro SSR pages (`prerender = false`) host a React `ChatShell` island
- D1 (`DB`) for chats / messages / attachments / library metadata
- R2 (`CHAT_LIBRARY`) for binaries; downloads only via authenticated Worker route
- OpenCode Go via Vercel AI SDK (`streamText`); openai-compatible vs anthropic by model id
- Plain CSS + Midnight Concert Hall tokens; no Tailwind / chat UI kits

## Workstreams

1. **Foundation** — wrangler bindings, SQL migration, shared types/helpers, deps, `.dev.vars.example`
2. **UI shell** — nav Chat link, `/chat`, `/chat/archive`, ChatShell sidebar + panes, mobile drawer
3. **Chats API** — CRUD + messages load; sidebar archive/delete; archive restore/delete
4. **AI streaming** — `POST /api/chat`, model catalog endpoint, model picker, markdown
5. **Library** — upload/list/delete/download; Library-first attach; block delete while referenced
6. **Polish / docs** — Access checklist, README + PROJECT_MEMORY, smoke-test notes

## File map (target)

```
migrations/0001_chat_schema.sql
wrangler.jsonc                          # DB + CHAT_LIBRARY bindings
.dev.vars.example
src/lib/chat/{types,constants,models,library,title,access,db,env}.ts
src/pages/chat/index.astro
src/pages/chat/archive.astro
src/pages/api/chat/index.ts
src/pages/api/chat/models.ts
src/pages/api/chats/index.ts
src/pages/api/chats/[id].ts
src/pages/api/library/index.ts
src/pages/api/library/[id].ts
src/pages/api/library/[id]/content.ts
src/components/chat/ChatShell.tsx (+ CSS / subcomponents)
docs/chat-access-setup.md
```

## API sketch

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/chats?archived=0\|1` | List chats |
| POST | `/api/chats` | Create chat `{ title?, modelId? }` |
| PATCH | `/api/chats/:id` | Rename / archive / restore / model |
| DELETE | `/api/chats/:id` | Permanent delete (+ messages/attachments) |
| GET | `/api/chats/:id` | Chat + messages (+ attachment meta) |
| GET | `/api/chat/models` | Go catalog (cached) + fallback static list |
| POST | `/api/chat` | Stream; body `{ chatId, messages, modelId, attachmentIds? }` |
| GET | `/api/library` | List assets |
| POST | `/api/library` | Multipart upload → R2 + row |
| DELETE | `/api/library/:id` | Delete if unreferenced; else 409 + chat titles |
| GET | `/api/library/:id/content` | Authenticated download stream |

## Verification

- `npm test` — pure helpers (provider kind, MIME→kind, title truncate, safe filename)
- `npm run build` — must pass
- Manual: set `OPENCODE_API_KEY` in `.dev.vars`; `npm run dev`; open `/chat`; new chat; stream with DeepSeek V4 Flash; upload→attach; archive/restore
- Production: create D1 + R2, `wrangler secret put OPENCODE_API_KEY`, Access app paths (see `docs/chat-access-setup.md`)

## Out of scope (v1)

- Skills runtime, multi-user, public R2 URLs, Workers AI as host, chat UI kits

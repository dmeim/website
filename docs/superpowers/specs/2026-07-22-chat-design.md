# Private AI Chat (`/chat`) — Design Spec

**Date:** 2026-07-22  
**Status:** Approved for planning (pending user review of this document)  
**Site:** dmeim.com (Astro 7 · Cloudflare Workers · Midnight Concert Hall)

## 1. Goal

Ship a private, Access-gated AI chat at `/chat` for the site owner only. Layout follows a ChatGPT-style sidebar + main pane (structure), styled with the existing Midnight Concert Hall CSS tokens (visuals). Models come from the owner’s [OpenCode Go](https://opencode.ai/docs/go/) subscription via the Vercel AI SDK. Uploaded assets live in a durable Library (R2) and are reusable across chats.

## 2. Non-goals (v1)

- Multi-user accounts or roles
- Pi / coding-agent backend (tools, bash, skills runtime)
- Skills upload/management UI beyond a stub or hidden nav item
- Drop-in chat UI kits (AI Elements, shadcn chatbot, assistant-ui) — conflict with plain-CSS ADR
- Cloudflare Workers AI as the model host (OpenCode Go is the provider)
- Public discovery of chat content (Access is the gate)

## 3. Decisions summary

| Topic | Decision |
| --- | --- |
| Auth | Cloudflare Access on `/chat*` and related APIs |
| Chat stack | Vercel AI SDK (`ai` + React hooks) + custom React island |
| Styling | Plain CSS using existing design tokens; no Tailwind / UI libraries |
| Models | OpenCode Go; full catalog from `GET https://opencode.ai/zen/go/v1/models` |
| Persistence | D1 for chats/messages/metadata; R2 for Library binaries |
| Nav | Primary nav includes Chat (easy to remove later) |
| Uploads | Always Library-first, then attach to the chat message |
| Layout | Tools-like left rail + right pane |

## 4. Architecture

```text
Browser
  │
  ├─ Cloudflare Access  (email OTP / policy: owner only)
  │     allows /chat*, /api/chat*, /api/chats*, /api/library*
  │
  ▼
Astro on Cloudflare Workers
  ├─ Pages (SSR, prerender = false for chat surfaces)
  │     /chat (Library + Archive as ChatShell right-pane modes)
  ├─ React island: ChatShell (sidebar + active pane)
  └─ API routes
        POST /api/chat          → AI SDK stream → OpenCode Go
        CRUD /api/chats*        → D1
        CRUD /api/library*      → D1 metadata + R2 objects
```

**Secrets / bindings (Wrangler):**

- `OPENCODE_API_KEY` — OpenCode Go API key (secret)
- `DB` — D1 database binding
- `CHAT_LIBRARY` — R2 bucket binding

**Provider wiring:** OpenCode Go exposes OpenAI-compatible (`/zen/go/v1/chat/completions`) and Anthropic-compatible (`/zen/go/v1/messages`) endpoints. The Worker selects the correct AI SDK package (`@ai-sdk/openai-compatible` vs `@ai-sdk/anthropic`) based on model metadata from `/v1/models` (or a maintained mapping derived from [Go docs](https://opencode.ai/docs/go/)).

## 5. Information architecture & routes

| Path | Purpose |
| --- | --- |
| `/chat` | Main shell: sidebar + active chat (or empty/new state); Library and Archive are right-pane modes |
| `/chat?c=<chatId>` (or `/chat/<id>`) | Active chat selection (exact URL shape chosen in implementation plan; prefer query or soft client state to match Tools shell if simpler) |
| `/chat/library` | Optional dedicated Library view; may instead be a right-pane mode toggled from the sidebar |
| `POST /api/chat` | Streaming completion for the active chat |
| `/api/chats` … | List / create / rename / archive / delete chats; load messages |
| `/api/library` … | List / upload / delete Library assets; attach references to chats |

**Primary nav:** Add a Chat entry alongside existing links. Removing it later is a one-line content/config change.

## 6. UI design

### 6.1 Shell

Mirror the Tools split (`ToolsShell`: left catalogue, right main), adapted for chat:

- Left: chat sidebar (persistent within `/chat*`)
- Right: active surface (chat thread, Library browser, or empty state)

Use site tokens (`--color-ground`, `--color-accent`, `--font-sans` / display / serif, borders, surfaces). Do **not** copy ChatGPT’s light gray chrome, Inter stack, or purple accents. Structure reference: ChatGPT sidebar (New chat, sections, history list with hover actions); visual language: Midnight Concert Hall.

### 6.2 Sidebar items

1. **New Chat** — creates a D1 chat row, selects it, clears/resets the composer thread for that id  
2. **Library** — opens Library view (pane or `/chat/library`); browse/search assets; upload new assets; attach selected assets into the active chat  
3. **Skills** — out of v1 product behavior; hide or show a disabled/stub item so IA stays stable  
4. **Chats** — collapsible section listing non-archived chats (title, optional preview/date). On hover (and keyboard focus): **Archive** and **Delete** actions  
5. **Archive** — opens Archive pane (same shell pattern as Library). Lists archived chats with **Restore** and **Delete**

### 6.3 Main chat pane

- Header: chat title (editable optional in v1), **model picker** populated from full Go catalog  
- Message list: user / assistant turns; streaming assistant tokens; markdown rendering acceptable if it matches site typography  
- Composer: textarea, send, stop (if AI SDK supports abort), **attach** control that triggers Library-first upload then attachment to the pending/outbound message  
- Empty state when no chat selected / brand-new chat

### 6.4 Library pane / page

- Grid or list of assets (image, video, PDF, other) with type, name, date  
- Upload control (same pipeline as chat attach)  
- Actions: delete from Library — **block while referenced** by any message (UI lists which chats); detach or delete those messages’ links first  
- Selecting an asset while a chat is active can “attach to current chat”

### 6.5 Responsive behavior

Follow Tools precedent where practical: on narrow viewports, prefer chat pane first with a way to open the sidebar (drawer/toggle). Exact mobile pattern decided in implementation; desktop split is the primary design.

## 7. Data model

### 7.1 D1 — suggested tables

**`chats`**

| Column | Notes |
| --- | --- |
| `id` | TEXT PK (UUID) |
| `title` | TEXT |
| `model_id` | TEXT (OpenCode Go model id, e.g. `kimi-k2.7-code`) |
| `archived_at` | TEXT nullable (ISO); null = active |
| `created_at` / `updated_at` | TEXT ISO |

**`messages`**

| Column | Notes |
| --- | --- |
| `id` | TEXT PK |
| `chat_id` | TEXT FK → chats |
| `role` | `user` \| `assistant` \| `system` |
| `content` | TEXT (primary text body) |
| `created_at` | TEXT ISO |
| Order | by `created_at` or explicit `seq` |

**`message_attachments`**

| Column | Notes |
| --- | --- |
| `id` | TEXT PK |
| `message_id` | TEXT FK |
| `library_asset_id` | TEXT FK → library_assets |
| Join ensures chat messages reference Library rows, never raw orphan blobs |

**`library_assets`**

| Column | Notes |
| --- | --- |
| `id` | TEXT PK |
| `r2_key` | TEXT unique |
| `filename` | TEXT |
| `content_type` | TEXT |
| `byte_size` | INTEGER |
| `kind` | `image` \| `video` \| `pdf` \| `other` (derived from content type) |
| `created_at` | TEXT ISO |

Exact schema may add indexes on `chats.archived_at`, `messages.chat_id`, `library_assets.created_at`.

### 7.2 R2

- Object key scheme: `library/<assetId>/<safeFilename>` (or similar immutable path)  
- Serve downloads via authenticated Worker route (do not make the bucket public)  
- Max size / allowed MIME types: define in implementation (sensible defaults; reject executables)

## 8. Upload & attach flow

Every upload follows the same pipeline whether started from Library or the composer:

1. Client selects file(s)  
2. `POST /api/library` (multipart or direct-to-R2 via Worker proxy) writes R2 object + `library_assets` row  
3. Client receives asset id(s)  
4. If attaching to a chat: create/update the outbound user message with `message_attachments` rows pointing at those ids  
5. Asset remains in Library for reuse in other chats without re-upload  

Deleting a Library asset: **block delete while referenced** by `message_attachments`, with UI listing which chats still use it.

## 9. Streaming chat flow

1. Client sends message history + `modelId` + optional attachment ids to `POST /api/chat`  
2. Worker verifies request is within Access session (Access JWT / CF headers as applicable for Workers)  
3. Persist user message (+ attachments) to D1  
4. Resolve model → OpenCode Go provider client  
5. `streamText` (AI SDK); stream response to client  
6. On finish, persist assistant message to D1; update `chats.updated_at` / title if first turn auto-title is implemented  

**Auto-title (optional v1):** after first user message, set title from a truncated prompt or a short model call — nice-to-have, not blocking.

**Model catalog:** fetch `/v1/models` server-side (cache in memory / KV short TTL if useful); expose to client via `/api/chat/models` or embed on page load. Picker shows the full Go catalog; remember last-used model per chat (`chats.model_id`) and a global default for new chats.

## 10. Auth (Cloudflare Access)

- Create a self-hosted Access application for `dmeim.com` with path include `/chat*` (and ensure API paths under the same protection — either same app path rules or explicit `/api/chat*`, `/api/chats*`, `/api/library*`)  
- Policy: Allow only the owner’s email (One-time PIN IdP is sufficient; no Google required)  
- Rest of the public site remains ungated  
- App code may additionally check Access identity headers for defense in depth on API routes; Access is the primary control  

**Ops checklist (owner):** Zero Trust org → Identity provider One-time PIN → Application + Allow policy → verify unauthenticated users never see chat HTML or API data.

## 11. Error handling

| Case | Behavior |
| --- | --- |
| Unauthenticated | Cloudflare Access login; app never renders private data |
| Invalid / missing `OPENCODE_API_KEY` | API 503/500 with safe message; composer shows error |
| Go rate / usage limits | Surface provider error text; do not drop unsent user message without feedback |
| Model list fetch failure | Fall back to a small static list from known Go model ids, or last successful cache |
| Upload failure | No Library row; no attachment; toast/inline error |
| Stream abort | Client stop button; partial assistant text may be saved or discarded — prefer save partial with flag or discard consistently (plan picks one; recommend discard on abort unless finish event fired) |

## 12. Security & privacy

- Single-tenant assumption: one owner behind Access  
- No public R2 URLs  
- Do not log prompt/completion bodies to third-party analytics  
- CSP and existing security headers remain; add connect-src allowances only if required for same-origin APIs (OpenCode calls are server-side)  
- Secrets only in Wrangler / Cloudflare dashboard — never `PUBLIC_*`

## 13. Testing strategy

- Unit tests for pure helpers (model id → provider kind, MIME → library kind, title truncation)  
- Optional integration tests against D1/R2 mocks if the repo pattern supports it  
- Manual checklist: Access deny/allow, new chat, stream, model switch, upload→Library→attach→reuse in second chat, archive/restore/delete, nav Chat link present  

## 14. Implementation phasing (guidance for plan)

1. Wrangler D1 + R2 bindings; migrations; secrets  
2. Access docs / path config (owner action)  
3. Chat shell UI (sidebar + empty pane) matching Tools split + tokens  
4. Chats CRUD + history list + archive/delete/restore  
5. OpenCode Go + AI SDK streaming + model picker (full catalog)  
6. Library upload/list/delete + Library-first attach  
7. Polish: markdown, mobile drawer, auto-title, Skills stub  

## 15. Open implementation choices (resolved during planning)

These are intentionally left as plan-time defaults unless the user overrides:

- Exact URL for active chat (`?c=` vs `/chat/[id]`)  
- Library as pane mode vs `/chat/library` route (both acceptable; pane mode closer to Tools)  
- Abort/partial message persistence (recommend discard until complete)  
- Default model id for brand-new chats (e.g. `kimi-k2.7-code` or `deepseek-v4-flash` — pick in plan)

## 16. References

- [OpenCode Go](https://opencode.ai/docs/go/) — endpoints, model ids, AI SDK packages  
- [Cloudflare Access — One-time PIN](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/)  
- Existing UI precedent: `src/components/tools/ToolsShell.astro`, `ToolsSidebar.astro`  
- Project ADRs: `DECISIONS.md` (plain CSS; Cloudflare adapter)

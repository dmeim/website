# Chat robustness backlog — ChatGPT-class daily driver

**Date:** 2026-07-22  
**Site:** dmeim.com `/chat`  
**Related:** `2026-07-22-chat-design.md`, recent persist-on-disconnect (`consumeStream` / `waitUntil`)

Goal: make private chat reliable enough for day-to-day replacement of ChatGPT. Prioritize correctness of in-flight generation, navigation within the shell, and recovery after disconnect over parity features.

---

## Status (2026-07-22 late evening)

| ID | Item | Status |
| --- | --- | --- |
| P0.1–P0.4 | Generating indicators + poll | **Done** (`generating_at`, status API, sidebar/pane, ~1.5s poll) |
| P1.1 | Stuck Send / streaming edge cases | **Done** (client abort on navigate; Stop clears busy) |
| P1.2 | Duplicate / remount race | **Done** (poll replaces thread from D1) |
| P1.3 | Stop generation UX | **Done** (`POST /api/chats/[id]/stop` + AbortController; persist partials) |
| P1.4 | Error / retry / rate-limit | **Done** (`last_error` + pane Retry) |
| P1.5 | Auto-scroll | **Done** (near-bottom stickiness) |
| P1.6 | Markdown / code blocks | **Done** (fence chrome + Copy) |
| P1.7 | Title updates in sidebar | **Done** (list refresh on finish + poll) |
| P1.8 | Abort vs persist across nav | **Done** (nav ≠ cancel; Stop = cancel) |
| P2.1 | Edit / regenerate | **Done** (regenerate last; edit-user forks + auto-regenerate) |
| P2.2 | Branching / fork | **Done** (`POST …/fork`, header + per-message Fork; lineage columns) |
| P2.3 | Search chats | **Done** (sidebar title filter) |
| P2.4 | Keyboard shortcuts | **Done** (Esc, ⌘⇧O, ⌘/, Enter/⌘Enter) |
| P2.5 | Multimodal to model | **Done** (images ≤4MiB; text/JSON extract; PDF via unpdf; video/other = notes) |
| P2.6 | Context truncation | **Done** (keep recent 40 msgs) |
| P2.7 | Export chat | **Done** (`GET …/export` markdown) |
| P2.8 | Mobile drawer polish | **Done** (backdrop/overscroll/padding) |
| P2.9 | Skills | **Deferred** (stub remains) |

**Local storage:** wipe/reapply local D1 + R2 OK; migrations `0001`–`0004` (fork lineage). No production wipe/deploy unless needed.

---

## Confirmed / high (P0)

### P0.1 — No in-progress indicator when returning to a generating chat

- **Symptom:** User sends a message, navigates away (e.g. Library), returns to the chat while the server is still generating — thread shows the user message only; no “Generating…” / spinner.
- **Why it matters:** Feels like the request died; user may re-send and create duplicates or abandon the chat.
- **Suggested approach:** Persist a per-chat `generating_at` (D1) set when stream starts and cleared when the assistant message is persisted (or on hard failure). Expose via chat list/detail and/or `GET /api/chats/[id]/status`. UI shows “Generating…” in the main pane when viewing that chat.
- **Shipped:** Yes.

### P0.2 — No live refresh of messages after navigate-away

- **Symptom:** Reply only appears after a full page reload; returning to the chat does not pull the new assistant row until manual refresh.
- **Why it matters:** Server may already have finished and written to D1; client never re-fetches.
- **Suggested approach:** While `generating` (or until an assistant message arrives after a trailing user turn), poll messages every ~1–2s (or subscribe later via SSE). Stop polling when the assistant row is present and status is idle.
- **Shipped:** Yes.

### P0.3 — Sidebar doesn’t show which chats are generating

- **Symptom:** Chat list looks idle for every conversation, even ones mid-stream on the server.
- **Why it matters:** User cannot find the “live” chat or tell work is still happening across the shell.
- **Suggested approach:** Include `generatingAt` on `GET /api/chats`; render a badge/dot on list items. Poll the chat list on the same cadence while any chat is generating (or always lightly while the shell is open).
- **Shipped:** Yes.

### P0.4 — Possible empty gap after user message until D1 assistant write completes

- **Symptom:** After navigate-away / remount, last message is user with no assistant placeholder; gap until persist finishes.
- **Why it matters:** Looks broken even when generation is healthy.
- **Suggested approach:** Treat “last message is user + `generatingAt` set” as in-progress UI (status row / spinner). Do not invent a fake assistant id that could race with the server insert; server remains source of truth for the assistant row.
- **Shipped:** Yes.

---

## Likely (P1)

### P1.1 — Stuck Send / streaming status edge cases — **Shipped**

Client `stop()` on chat select; Stop button clears local + server busy.

### P1.2 — Duplicate messages on remount vs server persist race — **Shipped**

Poll merge replaces thread from D1 by id/seq.

### P1.3 — Stop generation UX — **Shipped**

`POST /api/chats/[id]/stop` aborts in-isolate `AbortController`; `onAbort` persists partials and clears `generating_at`. Navigate-away does **not** call stop.

### P1.4 — Error / retry / rate-limit surfacing — **Shipped**

`chats.last_error` (migration `0003`); pane error + Retry (regenerate path).

### P1.5 — Auto-scroll while streaming; scroll position after return — **Shipped**

Autoscroll only when near bottom (`NEAR_BOTTOM_PX`).

### P1.6 — Markdown / code block rendering quality — **Shipped**

`MarkdownBody` fence bar + Copy; overflow styles.

### P1.7 — Chat title updates in sidebar after first message — **Shipped**

List refresh on stream finish and during generation poll.

### P1.8 — Abort vs persist consistency across Library / Archive / New chat — **Shipped**

Library/nav keeps server generation; only Stop cancels.

---

## Parity nice-to-haves (P2)

### P2.1 — Edit / regenerate message — **Shipped**

Regenerate last assistant (or retry after failed user turn). Edit on a user message forks into a new chat (messages before + edited turn), leaves the original intact, then auto-regenerates the assistant reply.

### P2.2 — Branching / fork chat — **Shipped**

`POST /api/chats/[id]/fork` with optional `messageId` / `editContent`. D1 lineage: `forked_from_chat_id`, `forked_from_message_id`. UI: header Fork + per-message Fork here.

### P2.3 — Search chats — **Shipped**

Sidebar title filter.

### P2.4 — Keyboard shortcuts — **Shipped**

Esc stop/close · ⌘/Ctrl+Shift+O new chat · ⌘/Ctrl+/ or `/` focus composer · Enter / ⌘Enter send.

### P2.5 — Multimodal attachments actually sent to the model — **Shipped**

Images loaded from R2 and passed as image parts (≤4 MiB). Text-like files and PDFs extracted best-effort into the prompt (`unpdf` for PDF). Video/other binaries degrade to filename + type + size notes without failing the chat. Limits documented in empty-state / attach tooltip / `extract-attachment.ts`.

### P2.6 — Context window / truncation strategy — **Shipped**

Keep recent `CHAT_CONTEXT_MAX_MESSAGES` (40); prefer starting on a user turn; system hint when truncated.

### P2.7 — Export chat — **Shipped**

`GET /api/chats/[id]/export` → markdown download; Export button in header.

### P2.8 — Mobile drawer polish — **Shipped**

Backdrop, overscroll contain, tighter padding, wrap header.

### P2.9 — Skills (deferred) — **Deferred**

Stub remains disabled.

---

## Verification

### P0

1. Open `/chat`, send a message that takes a few seconds.
2. Immediately open Library (do not hard-refresh).
3. Sidebar should show a generating badge/dot on that chat.
4. Return to the chat → see “Generating…” if still in flight.
5. When the assistant finishes, the reply appears **without** a full page reload.

### P1 / P2 smoke

1. **Stop:** Send a long prompt → Stop → busy clears; partial may appear after brief poll.
2. **Error/Retry:** Force a bad model / missing key → error banner + Retry.
3. **Scroll:** Scroll up mid-stream → should not jump; scroll near bottom → follows.
4. **Markdown:** Ask for a fenced code block → Copy works.
5. **Title:** First message → sidebar title updates without reload.
6. **Search:** Type in sidebar search → filters by title.
7. **Regenerate:** After a reply → Regenerate on last assistant.
8. **Edit→fork:** Edit a past user message → Save & branch → new chat selected; original intact; assistant regenerates.
9. **Fork:** Header Fork (full) or Fork here on a bubble → new chat with truncated history.
10. **Export:** Export → downloads `.md`.
11. **Shortcuts:** ⌘⇧O new chat; Esc stops; `/` focuses composer.
12. **Images:** Attach a small PNG → model request includes image part.
13. **Text/PDF:** Attach `.txt` / `.pdf` → model receives extract (or clear degradation note if extract fails).
14. **Video:** Attach a small video → reply still works; filename note only.

### Local migration

```bash
# If upgrading an existing local DB:
npx wrangler d1 migrations apply dmeim-chat --local

# Or wipe local chat state (safe when empty) and re-apply:
rm -rf .wrangler/state/v3/d1 .wrangler/state/v3/r2
npx wrangler d1 migrations apply dmeim-chat --local
```

Migrations: `0001` schema · `0002` generating_at · `0003` last_error · `0004` fork lineage.

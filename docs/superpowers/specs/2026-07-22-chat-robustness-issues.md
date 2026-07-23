# Chat robustness backlog — ChatGPT-class daily driver

**Date:** 2026-07-22  
**Site:** dmeim.com `/chat`  
**Related:** `2026-07-22-chat-design.md`, recent persist-on-disconnect (`consumeStream` / `waitUntil`)

Goal: make private chat reliable enough for day-to-day replacement of ChatGPT. Prioritize correctness of in-flight generation, navigation within the shell, and recovery after disconnect over parity features.

---

## Confirmed / high (P0)

### P0.1 — No in-progress indicator when returning to a generating chat

- **Symptom:** User sends a message, navigates away (e.g. Library), returns to the chat while the server is still generating — thread shows the user message only; no “Generating…” / spinner.
- **Why it matters:** Feels like the request died; user may re-send and create duplicates or abandon the chat.
- **Suggested approach:** Persist a per-chat `generating_at` (D1) set when stream starts and cleared when the assistant message is persisted (or on hard failure). Expose via chat list/detail and/or `GET /api/chats/[id]/status`. UI shows “Generating…” in the main pane when viewing that chat.

### P0.2 — No live refresh of messages after navigate-away

- **Symptom:** Reply only appears after a full page reload; returning to the chat does not pull the new assistant row until manual refresh.
- **Why it matters:** Server may already have finished and written to D1; client never re-fetches.
- **Suggested approach:** While `generating` (or until an assistant message arrives after a trailing user turn), poll messages every ~1–2s (or subscribe later via SSE). Stop polling when the assistant row is present and status is idle.

### P0.3 — Sidebar doesn’t show which chats are generating

- **Symptom:** Chat list looks idle for every conversation, even ones mid-stream on the server.
- **Why it matters:** User cannot find the “live” chat or tell work is still happening across the shell.
- **Suggested approach:** Include `generatingAt` on `GET /api/chats`; render a badge/dot on list items. Poll the chat list on the same cadence while any chat is generating (or always lightly while the shell is open).

### P0.4 — Possible empty gap after user message until D1 assistant write completes

- **Symptom:** After navigate-away / remount, last message is user with no assistant placeholder; gap until persist finishes.
- **Why it matters:** Looks broken even when generation is healthy.
- **Suggested approach:** Treat “last message is user + `generatingAt` set” as in-progress UI (status row / spinner). Do not invent a fake assistant id that could race with the server insert; server remains source of truth for the assistant row.

---

## Likely (P1)

### P1.1 — Stuck Send / streaming status edge cases

- **Symptom:** Composer stuck on Stop/Send disabled after abort, navigate, or transport error; `useChat` status never returns to ready.
- **Why it matters:** Blocks further messaging in that session.
- **Suggested approach:** On shell navigation away from an active stream, abort client transport deliberately (server continues). On remount/select, reset local stream state; rely on server status + poll. Add timeout / “recover” if status stuck.

### P1.2 — Duplicate messages on remount vs server persist race

- **Symptom:** Client optimistic / streamed assistant + server `insertMessage` both appear after reload, or user message duplicated if send is retried.
- **Why it matters:** Corrupts history and confuses the model context.
- **Suggested approach:** Server is source of truth for persisted turns. Client must not POST a second assistant save. When polling merges, replace thread from D1 (by id/seq), do not append blindly. Consider idempotency keys later if client retries user send.

### P1.3 — Stop generation UX

- **Symptom:** Stop may only cancel the client reader; server `consumeStream` continues; partial save vs discard unclear.
- **Why it matters:** User expects Stop to halt tokens and define what is saved.
- **Suggested approach:** Explicit abort path that marks generation cancelled, clears `generating_at`, and either persists partial (flagged) or discards consistently (spec currently leans discard-until-complete; align UI copy).

### P1.4 — Error / retry / rate-limit surfacing

- **Symptom:** Provider 429/5xx or missing key surfaces poorly; user message may exist with no assistant and no clear error.
- **Why it matters:** Daily driver needs actionable failure, not a silent hang.
- **Suggested approach:** Clear `generating_at` on failure; store last error on chat or return via status endpoint; banner + Retry that re-sends last user turn without duplicating if already persisted.

### P1.5 — Auto-scroll while streaming; scroll position after return

- **Symptom:** Stream jumps scroll; returning mid-thread jumps to bottom unexpectedly or fails to show new reply.
- **Why it matters:** Reading older context while generating is common.
- **Suggested approach:** Autoscroll only if user was already near bottom; preserve scroll on poll merge unless they are following the live reply.

### P1.6 — Markdown / code block rendering quality

- **Symptom:** Code fences, tables, or long pre blocks render poorly vs ChatGPT.
- **Why it matters:** Coding / docs use-case is a primary OpenCode Go workload.
- **Suggested approach:** Harden `MarkdownBody` (fences, copy button, overflow); keep Midnight Concert Hall typography.

### P1.7 — Chat title updates in sidebar after first message

- **Symptom:** Server auto-titles from first prompt, but sidebar still shows “New chat” until refresh.
- **Why it matters:** Hard to find recent chats.
- **Suggested approach:** Refresh chat list on stream finish and during generation poll (title is on the same row as `generating_at`).

### P1.8 — Abort vs persist consistency across Library / Archive / New chat

- **Symptom:** Leaving the active chat for Library/Archive/New chat aborts client stream; without status+poll, UX feels dead even though server continues.
- **Why it matters:** Shell navigation is the reported failure mode.
- **Suggested approach:** Same as P0: never treat client abort as “generation cancelled” unless user hits Stop with a server-ack cancel. Track `generatingChatIds` locally + server flags; keep polling from Library view for sidebar badges.

---

## Parity nice-to-haves (P2)

### P2.1 — Edit / regenerate message

- **Symptom:** No way to edit a user turn or regenerate the last assistant reply.
- **Why it matters:** Common ChatGPT workflow for iteration.
- **Suggested approach:** Truncate thread from edited message server-side; re-run completion; or regenerate-last endpoint.

### P2.2 — Branching / fork chat

- **Symptom:** Cannot fork from a midpoint into a new chat.
- **Why it matters:** Explore alternate answers without losing history.
- **Suggested approach:** “Fork from here” copies messages up to seq N into a new chat id.

### P2.3 — Search chats

- **Symptom:** Long history only browsable by scroll order.
- **Why it matters:** Daily driver accumulates dozens of threads.
- **Suggested approach:** Client filter on title first; later FTS on messages in D1.

### P2.4 — Keyboard shortcuts

- **Symptom:** No Cmd/Ctrl+N, Esc to stop, etc.
- **Why it matters:** Power-user speed.
- **Suggested approach:** Small shortcut map documented in UI affordance.

### P2.5 — Multimodal attachments actually sent to the model

- **Symptom:** Files land in Library and are noted as `[Attached: …]` text only; images/PDFs not passed as multimodal parts.
- **Why it matters:** Attachment UX promises more than the model receives.
- **Suggested approach:** For vision-capable Go models, pass image parts; for others keep text note + optional extracted text.

### P2.6 — Context window / truncation strategy

- **Symptom:** Long chats may hit provider limits or silently degrade.
- **Why it matters:** Stability of long-running projects in one thread.
- **Suggested approach:** Truncate/summarize older turns server-side with a clear policy; show token/context warning when near limit.

### P2.7 — Export chat

- **Symptom:** No markdown/JSON export.
- **Why it matters:** Backup and sharing outside the app.
- **Suggested approach:** `GET /api/chats/[id]/export` → markdown download.

### P2.8 — Mobile drawer polish

- **Symptom:** Sidebar drawer / focus trap / backdrop may feel rough on small screens.
- **Why it matters:** Phone use is common for quick prompts.
- **Suggested approach:** Match Tools shell patterns; ensure composer and thread usable at 320px.

### P2.9 — Skills (deferred)

- **Symptom:** Skills nav is stubbed/disabled.
- **Why it matters:** Spec non-goal for v1; keep IA stable without implementing runtime.
- **Suggested approach:** Leave stub until a skills design ships.

---

## Implementation order (this session)

1. Land this issues document.
2. Ship P0.1–P0.4: `generating_at` + status on APIs + pane/sidebar indicators + message/list polling.
3. Address critical P1 slices that fall out of the same work (P1.2 merge-from-server, P1.7 title refresh via poll, P1.8 navigation semantics).
4. Defer remaining P1/P2 unless blocking daily use.

## Verification (P0)

1. Open `/chat`, send a message that takes a few seconds.
2. Immediately open Library (do not hard-refresh).
3. Sidebar should show a generating badge/dot on that chat.
4. Return to the chat → see “Generating…” (or equivalent) if still in flight.
5. When the assistant finishes, the reply appears **without** a full page reload.

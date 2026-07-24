# Chat ↔ Pi on a mini PC (exploration notes)

**Status:** Parking lot — keep the current OpenCode Go chat as-is. Revisit if/when integrating a remote Pi harness.  
**Date:** 2026-07-23  
**Related:** [chat-access-setup.md](./chat-access-setup.md), [chat design](./superpowers/specs/2026-07-22-chat-design.md)

These notes capture an architecture discussion: run [Pi](https://github.com/badlogic/pi-mono) (or similar harness) on a spare mini PC, keep the Astro `/chat` UI as the pane of glass, and connect the site to the box without rebuilding an agent harness.

---

## Goals

- Keep `/chat` as a first-class panel inside the existing Astro app (Access-gated).
- Do **not** reinvent an agent harness (Pi, OpenCode, Claude Code, Codex, etc. already exist).
- Prefer **Pi** because it is already in daily use, extendable, and has a first-class embedding protocol.
- Sync Pi config to the mini PC however is convenient (Syncthing, git, periodic copy) — ops detail, not a product blocker.
- Optionally move uploads/library onto the mini PC filesystem instead of (or in addition to) R2/D1 blobs.

## Non-goals (for now)

- Replacing the live chat implementation.
- Running Tailscale as the Worker↔mini-PC path.
- Shipping a Hostinger-style SSH terminal as the primary UX.
- Rebuilding thinking/tools/session loops from scratch in the Worker.

---

## Why not Tailscale for the Worker?

A Cloudflare Worker **cannot join a Tailscale network**. There is no Tailscale node/sidecar for Workers and no supported “dial `100.x` from `fetch()`” path.

| Use Tailscale for | Use Cloudflare Tunnel for |
|---|---|
| You ↔ mini PC (admin SSH, Syncthing, debugging) | Cloudflare edge / Worker ↔ mini PC |

Tunnel is the repeatable, Cloudflare-native private link. Tailscale remains optional for human access to the box.

---

## Cloudflare Tunnel (explainer)

Tunnel is the opposite of opening a port on the mini PC:

1. Install **`cloudflared`** on the mini PC.
2. It opens an **outbound-only** connection to Cloudflare (no inbound firewall holes, no public IP required).
3. Cloudflare can send traffic **back down that pipe** to a local service (e.g. `127.0.0.1:8787`).

The home router does not need port forwarding. The mini PC is not “on the public internet”; it is dialed into Cloudflare.

### What must run on the mini PC

Pi RPC is JSONL over stdin/stdout. Browsers and Workers speak HTTP/WebSocket. So a small **bridge** is required:

```text
[cloudflared] ──► localhost:8787 ──► bridge ──► pi --mode rpc
                     (HTTP/WS)         (JSONL)
```

The bridge:

- Accepts WebSocket (or SSE) from Cloudflare
- Spawns/manages `pi --mode rpc`
- Shuttles JSONL both ways

Pi stays Pi. The bridge is glue, not a harness.

### Two wiring options

#### A) Public hostname + Access (classic Tunnel — good first proof)

```text
Browser → dmeim.com (Worker, Access)
                │
                │  fetch / WS proxy
                ▼
         pi.dmeim.com  ──(Tunnel)──► mini PC :8787
         (Access-gated)
```

- Tunnel **published application**: hostname → `http://localhost:8787`
- Access policy: owner email only (same idea as `/chat`)
- Browser still talks only to `dmeim.com`; Worker proxies to the Pi hostname

Pros: familiar, documented, WebSockets work.  
Cons: a DNS name exists for the bridge (still Access-locked).

#### B) Private only via Workers VPC (no public Pi hostname)

```text
Browser → dmeim.com/chat + APIs  (Access)
                │
                │  env.PI_BRIDGE.fetch(...) / WS
                ▼
         Workers VPC binding
                │
                ▼
         Cloudflare Tunnel ──► mini PC :8787
```

- No public ingress for the agent service
- Register the local bridge as a **VPC Service** (or use a VPC Network binding)
- Only the Worker can reach it

Pros: tighter exposure model.  
Cons: Workers VPC is newer (beta); slightly more setup.

**Suggested order if building later:** prove with A, harden to B if desired. App architecture is the same either way.

**Rule:** the browser should not talk to the mini PC directly. Access gates the Astro app; the Worker is the only thing that speaks to the bridge.

---

## Pi RPC (the real integration surface)

Pi ships headless **RPC mode**:

```bash
pi --mode rpc [options]
```

Docs (upstream): coding-agent `docs/rpc.md` — JSONL commands on stdin, responses/events on stdout.

Useful for a web chat client:

| Concern | Pi RPC |
|---|---|
| User message | `prompt` (+ optional images) |
| Abort | `abort` |
| New chat | `new_session` |
| Thinking level | `set_thinking_level` / `cycle_thinking_level` |
| Streaming text + thinking | `message_update` with `text_*` / `thinking_*` deltas |
| Tools / bash | `tool_execution_*`, `bash_execution_update` |
| Extension dialogs | `extension_ui_request` / `extension_ui_response` |

So the “pane of glass” is a **structured event stream**, not a terminal screenshot. That maps cleanly onto the existing chat UI (messages, thinking, tools) with an adapter layer — without rebuilding the agent loop.

SSH / xterm in the page is the wrong primary path: you get a TUI blob and lose clean thinking/tool events. Access **browser-rendered SSH** remains a fine *debug escape hatch* (Hostinger-style), not the product UI.

Custom Pi extensions that “mirror the TUI” are usually unnecessary for the stream itself; RPC already is that stream. Extensions stay for capabilities; the website is an RPC client.

---

## Target architecture (if integrating later)

```text
Astro /chat UI  (keep look & feel; tailor to Pi sessions)
        │
        ▼
Worker  (Access + WS/SSE proxy + optional D1 index)
        │
        ▼
Tunnel  (cloudflared on mini PC)
        │
        ▼
Bridge  (HTTP/WS ↔ Pi JSONL)
        │
        ▼
pi --mode rpc  + Syncthing’d (or git’d) config / extensions / skills
```

### Product mapping ideas

| Current chat concept | Pi / mini PC |
|---|---|
| New chat | `new_session` (or new process) |
| Stream + thinking | Map `message_update` into existing UI |
| Library uploads | Write under e.g. `~/pi-library/` or a dedicated uploads dir on the box |
| Library list / trash / delete | Small bridge HTTP APIs over that folder (UI can stay similar) |
| Chat sidebar metadata | Optional D1 index (title, session id, updated_at) |
| Session transcripts | Pi session files on disk (source of truth); R2 optional backup |

D1 need not store file blobs. R2 is optional. Files can live on the mini PC; the web UI can still present library semantics.

---

## Hosting alternatives (same protocol)

| Host | Notes |
|---|---|
| **Mini PC + Tunnel** | Best fit for “my real Pi”: persistent disk, Syncthing, local tools, always-on |
| **Cloudflare Containers** | Worker + Container running `pi --mode rpc` + bridge; no home hardware; weaker for long-lived workspace / Syncthing; watch `sleepAfter`, cold start, disk |

Same adapter either way; only the Pi host changes. Containers are **not** “Pi inside the Worker isolate” — they are a Durable Object–managed Linux VM sidecar.

---

## Approaches ranked (from discussion)

1. **Recommended later:** Pi RPC adapter; host on mini PC; keep `/chat` UI.  
2. **Container-first Pi:** same adapter, Pi in a Cloudflare Container.  
3. **Access browser SSH:** full terminal UX; not a first-class chat panel.  
4. **Rebuild harness in Worker:** explicitly rejected — wheel already invented.

### “Fully Pi interface” in the browser?

- **Pi TUI via SSH:** Access browser SSH → real `pi` in a terminal. Separate from Astro chrome.  
- **Pi capabilities in a web UI:** Pi RPC + web client. The existing chat UI *is* that client (or a closer visual clone later). There is no stock drop-in “Pi web app”; RPC is the embedding path.

---

## Current decision

**Keep the existing OpenCode Go chat** (Vercel AI SDK `streamText`, D1, R2 library, Access). No mini-PC / Tunnel / Pi RPC work unless revisited.

This file is the bookmark for that revisit.

---

## Open questions for a future design pass

- Public hostname + Access (A) vs Workers VPC (B) for v1 connectivity?
- One long-lived `pi --mode rpc` process per user vs per chat session?
- How much of today’s AI SDK stream protocol to preserve vs speak Pi events more directly in the client?
- Library: bridge file API only, or also expose folder to Pi tools as cwd/attachments?
- Whether D1 remains the chat list or the UI lists Pi sessions from the box?

---

## References

- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)
- [Workers VPC](https://developers.cloudflare.com/workers-vpc/)
- [Access browser-rendered terminal](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/non-http/browser-rendering/)
- Pi RPC: `@mariozechner/pi-coding-agent` / `earendil-works/pi` → `packages/coding-agent/docs/rpc.md`
- Site Access paths: [chat-access-setup.md](./chat-access-setup.md)

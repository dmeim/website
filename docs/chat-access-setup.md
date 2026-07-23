# Cloudflare Access setup for `/chat`

Private chat surfaces must be gated so only you can reach them. Access is the primary control; the app may also inspect Access identity headers for defense in depth.

## Protect these paths

Create a **self-hosted** Access application on `dmeim.com` that includes at least:

- `/chat`
- `/chat/*`
- `/api/chat`
- `/api/chat/*`
- `/api/chats`
- `/api/chats/*`
- `/api/library`
- `/api/library/*`

Leave the rest of the public site ungated.

## Policy

1. Zero Trust → **Settings** → **Authentication** → add **One-time PIN** (email OTP) if not already enabled.
2. Zero Trust → **Access** → **Applications** → **Add an application** → **Self-hosted**.
3. Application domain: `dmeim.com` with the path includes above (or one app per path prefix if you prefer).
4. Policy: **Allow** when email equals your owner address (e.g. `hello@dmeim.com`).
5. Save and verify:

   - Incognito / logged-out browser hitting `https://dmeim.com/chat` shows the Access login, never chat HTML.
   - Authenticated session can load `/chat` and call `/api/chats`.
   - Public pages (`/`, `/tools`, …) still load without Access.

## Optional app-side enforcement

Set Worker var / secret `REQUIRE_ACCESS=1` to make API routes return `401` when `Cf-Access-Authenticated-User-Email` is missing. Local `astro dev` / miniflare should leave this unset so you can develop without Access headers.

## Secrets & bindings (production)

```bash
# After creating remote resources, put real ids in wrangler.jsonc
npx wrangler d1 create dmeim-chat
npx wrangler r2 bucket create dmeim-chat-library
npx wrangler d1 migrations apply dmeim-chat --remote
npx wrangler secret put OPENCODE_API_KEY
npx wrangler secret put EXA_API_KEY          # optional; Exa MCP skipped if unset
npx wrangler secret put CONTEXT7_API_KEY     # optional; Context7 MCP skipped if unset
```

Local:

```bash
cp .dev.vars.example .dev.vars
# edit OPENCODE_API_KEY=
# optional: EXA_API_KEY= / CONTEXT7_API_KEY=
npm run chat:reset-local   # wipe local D1 + CHAT_LIBRARY R2, apply migrations from scratch
# or only apply new migrations: npx wrangler d1 migrations apply dmeim-chat --local
npm run dev
```

`npm run chat:reset-local` removes `.wrangler/state/v3/d1` and `.wrangler/state/v3/r2`, then runs `wrangler d1 migrations apply dmeim-chat --local`. Wipe deletes data; migrate after wipe only creates empty tables — do not treat migrate-alone as a reset.

OpenCode Go key: https://opencode.ai/ (Zen / Go subscription → API key).

### MCP tools (Exa + Context7)

Chat can call remote MCP tools when enabled in the Wrench menu (per chat). Defaults: both servers on, all known tools on.

| Secret | Server | Auth |
|---|---|---|
| `EXA_API_KEY` | `https://mcp.exa.ai/mcp` | Header `x-api-key` (Exa also accepts `Authorization: Bearer`) |
| `CONTEXT7_API_KEY` | `https://mcp.context7.com/mcp` | Header `CONTEXT7_API_KEY` |

If a key is missing, that server is skipped and the chat still streams without those tools. Get keys from [exa.ai](https://exa.ai/) and [context7.com/dashboard](https://context7.com/dashboard) (Context7 keys typically start with `ctx7sk`).

Pinned Exa tools: `web_search_exa`, `web_fetch_exa`. Context7: `resolve-library-id`, `query-docs` (also discovered live from the server).

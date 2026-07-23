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
```

Local:

```bash
cp .dev.vars.example .dev.vars
# edit OPENCODE_API_KEY=
npx wrangler d1 migrations apply dmeim-chat --local
npm run dev
```

OpenCode Go key: https://opencode.ai/ (Zen / Go subscription → API key).

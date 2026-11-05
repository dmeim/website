# Tools: contributor brief

The site ships 86 browser tools at `/tools/<slug>`. 85 are ports of [it-tools](https://github.com/CorentinTh/it-tools) and one, the WordCode generator, is custom. Follow this when fixing a tool or adding a new one.

## Where things live

- **UI:** `src/components/tools/islands/<Name>.tsx`, plus a `.css` file only for chrome the UI library doesn't cover.
- **Logic:** `src/lib/tools/<id>/` holds the pure `*.service.ts`, its `*.service.test.ts`, and a `README.md`. Keep islands thin.
- **UI library:** `@/ui/react` and its CSS tokens. No Tailwind or component libraries.
- **Shared wiring:** add the catalogue entry to `src/content/tools.ts` and the lazy loader to `src/components/tools/toolRegistry.ts`. `src/pages/tools/[slug].astro` builds a page for every available tool.
- **it-tools reference (read only):** `handy-dandy/it-tools/src/tools/<id>/`, next to this repo.

## Adding or fixing a tool

1. Read the original's `.vue`, service, and any `*.test.ts` or `*.e2e.spec.ts` files. List its inputs, options, defaults, outputs, error states, and actions.
2. Match that behavior unless it is wrong (see "Deliberate differences" below). Port its test vectors.
3. Take expected values from a published spec or an independent source such as `node:crypto`, `openssl`, or `python3`, never from the tool's own output.
4. Check the tool in a browser: typical input, invalid input, empty state, every option, copy and download, and 375px wide.
5. **Check it on a production build too.** See the next section for why dev mode is not enough.
6. Update the tool's README if behavior changed.

## Production differs from dev

- **The minifier can delete validators.** It treats functions like `decodeURIComponent` as pure, so `try { decodeURIComponent(x); return true; }` loses the call and always returns true. Always use the result. See `src/lib/tools/url-encoder/urlEncoder.service.ts`.
- **Paths end in `.html` at build time.** `Astro.url.pathname` is `/tools.html` during a static build, so compare against a normalized path.
- **Lazy packages can 404 in dev.** A package loaded with a dynamic `import()` can return 404 from `/.vite/deps/` on a long-running dev server. Restart the server rather than working around it in product code.

## Conventions

- **Remembering settings:** use `useStoredState` or `useQueryState` from `src/components/tools/use-persisted-state.ts`, with the same choice of storage or URL as the original. Remember settings and harmless inputs such as IP addresses. Never persist secrets, tokens, or pasted payloads such as JSON or YAML. The HTML editor document is the one exception.
- **Randomness:** anything secret uses `crypto.getRandomValues`, with no `Math.random` fallback.
- **Blank input** is an empty state, not an error.
- **Network:** calculations stay local. No requests the original doesn't make.
- **Packages:** prefer native browser APIs, and add a dependency only when they can't do the job correctly.
- **Copy:** Oxford comma, no em dashes, American spelling, an en dash for empty values, and error messages that say how to fix the problem.
- **Credit:** no per-tool credits.

## Deliberate differences from it-tools

These are fixes, so don't change them back to match the original.

| Tool | Here | it-tools |
| --- | --- | --- |
| Hash text, HMAC | "SHA3" is real FIPS 202 SHA3-512; Keccak512 is its own option | "SHA3" outputs pre-standard Keccak-512 |
| OTP | Leftover Base32 bits are dropped, so codes match real authenticators; issuer is `dmeim.com` | Leftover bits become a key byte, so codes differ for secrets like 26-character ones |
| Bcrypt | Cost limited to the valid range of 4 to 31 | Allows 0 to 100, failing above 31 |
| Token generator | Duplicate symbols removed so no character is favored; includes `N` and `n` | Has duplicates and omits `N` and `n` |
| Case converter | Keeps digits and letters in every script | Deletes digits and all non-Latin text |
| Text to binary | UTF-8, so `é` is two octets | One value per UTF-16 code unit |
| List converter | Trims before deduplicating and sorting | Trims after |
| JSON to CSV | RFC 4180 quoting; nested values as JSON | `\"` escaping; nested values stringified |
| XML formatter | Reports broken markup | Silently auto-closes tags |
| Regex tester | Runs in a worker and stops a pattern after 1.5 seconds | Runs on the page and can freeze the tab |
| Temperature | Rounds to two decimals | Floors, so 0 °C shows as 31.99 °F |
| Percentage | Negative starts use the absolute value; float noise removed | Sign flips on negative starts |
| IPv4 address converter | Hex is 8 digits, binary is 32 bits, and short IPv6 is canonical (`::ffff:a00:1`) | Unpadded, and short IPv6 keeps leading zeros |
| Safelink decoder | Checks the link's real host | Matches the text anywhere in the link |

## Known limits

- **Math evaluator:** expressions like `ones(20000,20000)` can freeze the page, same as it-tools. Stopping them would need a worker.
- **TOML tools:** `iarna-toml-esm` rejects a valid local time such as `t = 07:32:00`, same as it-tools.
- **JSON and YAML:** integers above 2^53 lose precision on parse, same as it-tools.

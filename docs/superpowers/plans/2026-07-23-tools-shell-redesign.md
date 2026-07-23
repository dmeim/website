# Tools Shell Redesign Implementation Plan

> **For agentic workers:** Execute inline in this session. Steps use checkbox syntax for tracking.

**Goal:** Rewrite `/tools` as an immersive ChatShell-style SPA island: left catalogue nav stays mounted; right pane switches between catalogue and tool without remounting the shell; URLs stay `/tools` and `/tools/[slug]`.

**Architecture:** Astro pages mount one React `ToolsShell` (`client:only`). Client History API syncs selection. Tool islands load via `React.lazy` registry. CSS duplicates chat shell mechanics under `tools-*` prefixes — no shared extraction that risks chat regression.

**Tech Stack:** Astro 7 · React 19 · plain CSS · existing `src/content/tools.ts` catalogue

## Global Constraints

- SPA-like right-pane updates only; deep links + refresh must work
- Immersive BaseLayout (hide footer) like `/chat`
- Sidebar search required; WIP badge pattern even if zero WIP tools
- Do not break chat look/feel; do not deploy Workers
- Commit + push at milestones; never force-push

---

### Task 1: Registry + React shell foundation

**Files:**
- Create: `src/components/tools/toolRegistry.ts`
- Create: `src/components/tools/ToolsShell.tsx`
- Create: `src/components/tools/ToolsShell.css`
- Create: `src/components/tools/ToolsSidebar.tsx`
- Create: `src/components/tools/ToolCatalog.tsx`
- Create: `src/components/tools/ToolMount.tsx`
- Create: `src/components/tools/index.ts`
- Modify: `src/pages/tools/index.astro`
- Modify: `src/pages/tools/[slug].astro`
- Delete: Astro `ToolsShell` / `ToolsSidebar` / `ToolCatalog` / `ToolCatalogItem` once unused

**Interfaces:**
- Produces: `ToolsShell({ initialSlug?: string | null })`
- Produces: `getToolLoader(slug): (() => Promise<{ default: ComponentType }>) | undefined`
- Routing: `pushState`/`replaceState` + `popstate` for `/tools` ↔ `/tools/[slug]`

- [ ] **Step 1:** Add lazy `toolRegistry` mapping every available slug → island module (include `pdf-signature-checker`)
- [ ] **Step 2:** Implement `ToolsShell` + CSS mirroring chat immersive split (translucent panes, independent scroll, mobile drawer)
- [ ] **Step 3:** Implement sidebar (All tools, search, categories, per-tool + category WIP badges) and catalogue pane
- [ ] **Step 4:** Wire Astro pages to immersive `ToolsShell`; strip giant slug ternary
- [ ] **Step 5:** `npm run build` — must pass
- [ ] **Step 6:** Commit + push milestone

### Task 2: Polish + verify

- [ ] Confirm `/tools` catalogue, `/tools/[slug]` deep link, in-shell navigation, search filter, mobile menu
- [ ] Commit + push if polish landed
- [ ] Follow verification-before-completion before claiming done

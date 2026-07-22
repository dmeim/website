# Git memo

## Name
Git memo (`git-memo`)

## Description
Quick-reference cheatsheet for common Git commands — configuration, getting started, commits, undoing mistakes, and miscellaneous recipes.

## Toggles and Settings
None — static reference with an optional search filter.

## Inputs
- Search query (matches section title, description, or command text)

## Outputs
- Categorized list of Git command recipes (Configuration, Get started, Commit, I’ve made a mistake, Miscellaneous)
- Each entry shows a short description and one or more shell commands
- Non-empty search collapses matches into a single “Search results” group

## Notes
- Content copied from it-tools `git-memo.content.md` (no npm dependency)
- Search uses case-insensitive substring matching (same pattern as `http-status-codes`)
- Empty query restores the five source sections; it-tools itself only rendered the markdown with no search — search is a site-native affordance on the same content

## Source
Port of [it-tools Git cheatsheet](https://it-tools.tech/git-memo). Local reference: handy-dandy `it-tools` (`src/tools/git-memo/`). Catalogue id: `git-memo`.

## Files
- `src/lib/tools/git-memo/` — data, service, tests, README
- `src/components/tools/islands/GitMemo.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `git-memo`

## How to verify
```bash
npm test -- src/lib/tools/git-memo
npm run build
```
Open `/tools/git-memo`, confirm the five sections and commands match it-tools, search for `amend` / `reset`, and copy a command block.

# Lorem ipsum generator

## Name
Lorem ipsum generator (`lorem-ipsum-generator`)

## Description
Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content.

## Toggles and Settings
- Paragraphs (1–20, default `1`) — number of paragraphs to generate
- Sentences per paragraph (dual range 1–50, default `3–8`) — random sentence count per paragraph drawn from `[min, max)` (it-tools `randIntFromInterval` parity)
- Words per sentence (dual range 1–50, default `8–15`) — random word count per sentence from `[min, max)`
- Start with lorem ipsum (toggle, default on) — force the classic first sentence
- As HTML (toggle, default off) — wrap each paragraph in `<p>…</p>`

## Inputs
- None (generation is driven entirely by the settings above)

## Outputs
- Generated placeholder text (readonly multiline), with Copy and Refresh

## Notes
- Pure string logic; no npm dependencies
- Vocabulary and assembly match it-tools; sentence/word range sampling is half-open `[min, max)` like upstream
- Refresh re-rolls sentence/word counts within the selected ranges and reshuffles vocabulary
- Catalogue id: `lorem-ipsum-generator`

## Source
Port of [it-tools Lorem ipsum generator](https://it-tools.tech/lorem-ipsum-generator). Local reference: handy-dandy `it-tools` (`/lorem-ipsum-generator`).

## Files
- `src/lib/tools/lorem-ipsum-generator/` — service, tests, README
- `src/components/tools/islands/LoremIpsumGenerator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `lorem-ipsum-generator`

## How to verify
```bash
npm test -- src/lib/tools/lorem-ipsum-generator
npm run build
```
Open `/tools/lorem-ipsum-generator`, keep defaults, confirm the classic first sentence, then Copy / Refresh.

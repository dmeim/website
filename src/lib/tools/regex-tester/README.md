# Regex tester

## Name
Regex tester (`regex-tester`)

## Description
Test JavaScript regular expressions against sample text. Shows match indices, full match values, numbered capture groups, and named groups (with start/end offsets via the `d` indices flag). Also generates a RandExp sample string and a railroad-diagram visualization of the pattern.

## Toggles and Settings
- Global search (`g`) — default on
- Case-insensitive (`i`) — default off
- Multiline (`m`) — `^`/`$` next to newlines — default off
- Singleline / dotAll (`s`) — `.` matches newlines — default on
- Unicode (`u`) — default on
- Unicode Sets (`v`), default off. JavaScript rejects `u` and `v` together, so turning one on turns the other off.
- Sticky (`y`), default off. Not in it-tools.

The engine always adds the `d` flag so capture/group ranges are available.

## Inputs
- Regex pattern (multiline text)
- Text to match (multiline text)

## Outputs
- Highlighted matches in the input text (mark spans for each match)
- Matches table: index, value, captures, named groups (or “No match”)
- Sample matching text (RandExp)
- Regex railroad diagram (`@regexper/render`, isolated in a shadow root)

## Notes
- Patterns are validated against the selected flags, since `\-` is valid alone but a syntax error with `u`. Invalid patterns surface an error under the regex field and show no matches.
- Matching and sample generation run in a Web Worker (`regexTester.worker.ts`, `use-regex-run.ts`). After 1.5 seconds the worker is terminated and a notice explains catastrophic backtracking, so a pattern like `(a+)+$` cannot freeze the tab. If the worker cannot load, they run on the page instead.
- At most 1,000 matches are listed, with a notice saying so
- Zero-length matches are skipped, not listed (it-tools vectors), but the search continues past them, so `a*` finds `aaa` in `baaa`
- A group that did not take part in a match is listed as “did not match”. it-tools shows no matches at all in that case.
- Named groups in sample generation are rewritten `(?<name>…)` → `(?:…)` because RandExp does not support them
- The regex is kept in the `?regex=` URL parameter so a configured tester can be linked to or reloaded. it-tools also mirrors it to `localStorage`, which is not ported.
- Links to the Regex cheatsheet (`regex-memo`)

## Source
Port of [it-tools Regex Tester](https://it-tools.tech/regex-tester). Local reference: handy-dandy `it-tools` (`src/tools/regex-tester`). Catalogue id: `regex-tester`.

## Files
- `src/lib/tools/regex-tester/` — service, tests, README
- `src/components/tools/islands/RegexTester.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `regex-tester`

## How to verify
```bash
npm test -- src/lib/tools/regex-tester
npm run build
```
Open `/tools/regex-tester`, enter a pattern and text, toggle flags, confirm matches/captures/groups, sample text, and diagram.

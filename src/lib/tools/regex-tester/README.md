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
- Unicode Sets (`v`) — default off; applied only when Unicode (`u`) is off (it-tools precedence)

The engine always adds the `d` flag so capture/group ranges are available. Sticky (`y`) is not exposed (it-tools does not offer it).

## Inputs
- Regex pattern (multiline text)
- Text to match (multiline text)

## Outputs
- Highlighted matches in the input text (mark spans for each match)
- Matches table: index, value, captures, named groups (or “No match”)
- Sample matching text (RandExp)
- Regex railroad diagram (`@regexper/render`, isolated in a shadow root)

## Notes
- Invalid patterns surface an error under the regex field; match results fall back to empty (it-tools `try/catch` parity)
- Named groups in sample generation are rewritten `(?<name>…)` → `(?:…)` because RandExp does not support them
- Query-param / localStorage persistence from it-tools is not ported
- Link to Regex cheatsheet (`regex-memo`) omitted until that tool is available

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

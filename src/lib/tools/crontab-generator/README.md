# Crontab generator

## Name
Crontab generator (`crontab-generator`)

## Description
Validate a cron expression and show a human-readable English description of the schedule. Includes a field diagram and a quick-reference table of cron symbols and `@` shortcuts.

## Toggles and Settings
- **Verbose** — longer cronstrue wording (default on)
- **Use 24 hour time format** — 24h vs AM/PM in the description (default on)
- **Days start at 0** — Sunday as `0` vs `1` for day-of-week parsing in cronstrue (default on)

## Inputs
- Cron expression string (default `40 * * * *`)
- Supports 5-field and 6-field (with seconds) expressions; month/weekday aliases (`jan`, `mon`) and `?` blank day when valid

## Outputs
- Human-readable schedule description (or invalid state when the expression fails validation / cannot be described)
- Copy of the current expression
- Static field diagram + helpers reference table

## Notes
- Validation uses `cron-validator` with `{ allowBlankDay: true, alias: true, seconds: true }` (same as it-tools). `alias` means month/weekday names, not `@daily`-style macros — those macros are documented in the helpers table but fail the 5-field validator (parity with it-tools).
- Description uses `cronstrue` with `throwExceptionOnParseError: true`; parse failures (e.g. DOW `0` while “Days start at 0” is off) surface as invalid rather than throwing in the UI.
- `@reboot` is documentation-only (no equivalent expression).

## Source
Port of [it-tools crontab generator](https://it-tools.tech/crontab-generator). Local reference: handy-dandy `it-tools` (`/crontab-generator`). Catalogue id: `crontab-generator`.

## Files
- `src/lib/tools/crontab-generator/` — service, tests, README
- `src/components/tools/islands/CrontabGenerator.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `crontab-generator`

## How to verify
```bash
npm test -- src/lib/tools/crontab-generator
npm run build
```
Open `/tools/crontab-generator`, edit the expression, flip toggles, copy.

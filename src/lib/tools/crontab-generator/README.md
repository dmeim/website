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
- Supports 5-field and 6-field (with seconds) expressions; month/weekday aliases (`jan`, `mon`), `?` blank day, and the `@` shortcuts from the helpers table

## Outputs
- Human-readable schedule description, or a message naming the field at fault when the expression is invalid. Blank input shows neither.
- Copy of the current expression
- Static field diagram + helpers reference table

## Notes
- Validation uses `cron-validator` with `{ allowBlankDay: true, alias: true, seconds: true }` (same as it-tools). `@` shortcuts are expanded to their five-field equivalent first, which it-tools does not do even though its table lists them. `L`, `W`, and `#` are rejected (it-tools parity).
- Description uses `cronstrue` with `throwExceptionOnParseError: true`. With “Days start at 0” off, day of week runs 1 through 7: `7` is accepted and `0` reports why it is not.
- `@reboot` has no equivalent expression, so it is described as “Run at startup”.

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

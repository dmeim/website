# Keycode info

## Name
Keycode info (`keycode-info`)

## Description
Find the JavaScript `key`, `keyCode`, `code`, `location`, and modifier keys for any pressed key. Listens to native `keydown` events (no dependencies).

## Toggles and Settings
None. Press any key to update the fields.

## Inputs
Keyboard `keydown` events on the document (client-side only).

## Outputs
- **Key** — `KeyboardEvent.key`
- **Keycode** — legacy `KeyboardEvent.keyCode` (numeric)
- **Code** — `KeyboardEvent.code`
- **Location** — `KeyboardEvent.location` (0 standard, 1 left, 2 right, 3 numpad)
- **Modifiers** — active Meta / Shift / Ctrl / Alt joined with ` + ` (empty → placeholder “None”)

Each field is copyable.

## Notes
- `keyCode` is deprecated in the DOM spec but still exposed for parity with it-tools / legacy code
- Browser shortcuts (e.g. Cmd+T) may still fire; this tool does not call `preventDefault`
- Runs client-side only; SSR shows the idle prompt until hydration

## Source
Port of [it-tools Keycode info](https://it-tools.tech/keycode-info). Local reference: handy-dandy `it-tools` (`/keycode-info`). Catalogue id: `keycode-info`.

## Files
- `src/lib/tools/keycode-info/` — service, tests, README
- `src/components/tools/islands/KeycodeInfo.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `keycode-info`

## How to verify
```bash
npm test -- src/lib/tools/keycode-info
npm run build
```
Open `/tools/keycode-info`, press keys (letters, modifiers, arrows), and confirm fields match the browser’s KeyboardEvent values.

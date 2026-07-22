# Device information

## Name
Device information (`device-information`)

## Description
Show information about the current device and browser — screen size, orientation, pixel ratio, window size, vendor, languages, platform, and user agent. Reads live values from native `window` / `navigator` APIs (no dependencies).

## Toggles and Settings
None. Values refresh on window resize and orientation change.

## Inputs
None. The page environment is the source of truth.

## Outputs
- **Screen:** screen size, orientation, orientation angle, color depth, pixel ratio, window size
- **Device:** browser vendor, languages, platform, user agent
- Missing values display as `unknown` (same as it-tools)

## Notes
- Screen size uses `screen.availWidth` / `availHeight` (not full screen bounds)
- Window size tracks `innerWidth` / `innerHeight`
- Orientation fields require `screen.orientation` (may be unavailable in older browsers)
- Runs client-side only; SSR shows a brief loading state until hydration

## Source
Port of [it-tools Device information](https://it-tools.tech/device-information). Local reference: handy-dandy `it-tools` (`/device-information`). Catalogue id: `device-information`.

## Files
- `src/lib/tools/device-information/` — service, tests, README
- `src/components/tools/islands/DeviceInformation.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `device-information`

## How to verify
```bash
npm test -- src/lib/tools/device-information
npm run build
```
Open `/tools/device-information`, confirm Screen and Device fields match the browser, then resize the window and check Window size updates.

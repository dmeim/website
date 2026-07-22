# Camera Recorder

## Name
Camera recorder (`camera-recorder`)

## Description
Capture still photos and record video from the local webcam/camera. Preview, mirror/flip, and keep captures in an in-page gallery until you download or clear them. Media never uploads; it stays in the browser session.

## Toggles and Settings
- **Video input** device
- **Resolution** (default / 480p–4K ideals)
- **Aspect ratio** (native / 16:9 / 4:3 / 1:1 / 9:16)
- **Include microphone audio in videos** (+ audio input when enabled)
- **Mirror / Flip** orientation for preview, photos, and (when supported) recorded video
- **Start / Apply / Stop camera**, refresh devices
- **Take photo**, start/pause/resume/stop recording

## Inputs
- Live MediaStream from `getUserMedia` (secure context required)
- Device and constraint selections above

## Outputs
- Live preview
- Local gallery of photos (PNG data URLs) and videos (object URLs)
- Per-item Download / Delete, Clear all

## Notes
- Requires HTTPS or localhost; unsupported browsers show a clear unavailable state
- Resolution/aspect are best-effort constraints — use Apply settings while the camera is on
- Mirror/flip for recording uses a canvas capture stream when available; otherwise raw feed is recorded with a status note
- Filenames come from `cameraRecorder.service.ts`

## Source
Inspired by [it-tools Camera recorder](https://it-tools.tech/camera-recorder). Local path reference: handy-dandy `it-tools` (`/camera-recorder`). Catalogue id: `camera-recorder`.

## Files
- `src/lib/tools/camera-recorder/` — service helpers, `useMediaRecorder` hook, README
- `src/components/tools/islands/CameraRecorder.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `camera-recorder`

## How to verify
```bash
npm test -- src/lib/tools/camera-recorder
npm run build
```
Open `/tools/camera-recorder` over HTTPS or localhost, start camera, take a photo, download from the gallery.

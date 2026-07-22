# HTML WYSIWYG editor

## Name
HTML WYSIWYG editor (`html-wysiwyg-editor`)

## Description
Online, feature-rich WYSIWYG HTML editor that generates the source code of the content immediately. Edit with a formatting toolbar; the live HTML source updates as you type.

## Toggles and Settings
Toolbar actions (TipTap StarterKit, same set as it-tools):
- Bold, Italic, Strike, Inline code
- Heading 1–4
- Bullet list, Ordered list, Code block, Blockquote
- Hard break, Clear format, Undo, Redo

Content is persisted in `localStorage` under `html-wysiwyg-editor--html`.

## Inputs
- WYSIWYG editor surface (rich text)

## Outputs
- Live HTML source (readonly, pretty-printed) with a copy control

## Notes
- Uses `@tiptap/react` + `@tiptap/starter-kit` for parity with it-tools (which uses TipTap Vue)
- HTML pretty-print is a lightweight local helper (no Prettier dependency)
- Empty TipTap docs (`<p></p>`) show as an empty source pane
- Catalogue id: `html-wysiwyg-editor`

## Source
Port of [it-tools HTML WYSIWYG editor](https://it-tools.tech/html-wysiwyg-editor). Local reference: handy-dandy `it-tools` (`/html-wysiwyg-editor`).

## Files
- `src/lib/tools/html-wysiwyg-editor/` — service, tests, README
- `src/components/tools/islands/HtmlWysiwygEditor.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `html-wysiwyg-editor`

## How to verify
```bash
npm test -- src/lib/tools/html-wysiwyg-editor
npm run build
```
Open `/tools/html-wysiwyg-editor`, edit with the toolbar, confirm the HTML source updates, and copy works.

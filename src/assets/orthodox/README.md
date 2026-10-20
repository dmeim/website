# Orthodox screensaver images

Images here are picked up at build time by `src/lib/orthodox/assets.ts`. Nothing needs registering.

## Icons

```
icons/<collection>/<file>.{jpg,jpeg,png,webp,avif,svg}
```

- Each folder is a collection, listed in the screensaver's **Collection** picker. **All** combines every folder.
- The current collections are the months (`January/` … `December/`), shown in calendar order via `collectionOrder` in `src/content/orthodox.ts`. Any other folder is listed alphabetically after them.
- The folder name becomes the label (`great-feasts` → "Great Feasts"). Override it in `collectionLabels` in `src/content/orthodox.ts`.
- The file name becomes the alt text. Underscores, dashes, and a leading number are dropped, so `03-St_Nicholas.jpg` reads "St Nicholas".
- Boards are 3:4 portrait. Other shapes are cropped from the bottom (`object-position: center top`), so leave room under the figure.
- Full-size originals are fine. At build, each raster icon is resized to at most 1200px wide and converted to WebP, plus a 240px thumbnail for the icon picker; SVGs are served as-is.
- An icon's id is `<folder>/<file stem>` (e.g. `December/St_Nicholas_the_Wonderworker`). Custom-wall cards lock to icons by this id, so renaming or moving a file unlocks those cards (they show "Missing icon" while arranging) until the name is restored.

## Custom wall

Choosing the **Custom** layout opens an arranging mode, like jiggle mode on the iOS home screen:

- Drag a card to move it, and drag its bottom-right corner to resize it. Cards snap to a 48 × 48 grid over the wall, stored as grid steps, so a layout scales with the screen.
- **Add card** places a new portrait card in the first free spot; × removes one. A wall holds up to 24 cards.
- The chip on each card sets what it shows: **Any icon** (follows the Collection setting), **A group** (one folder, e.g. a month), or **One icon** (searchable by name, built from the file names). Icon-locked cards never rotate, and their icon isn't repeated on other cards.
- Keyboard: focus a card, then use the arrow keys to move it, Shift + arrow keys to resize it, Enter to choose what it shows, and Delete to remove it. Escape or **Done** leaves arranging.
- The first switch to Custom starts from the wall as it currently hangs. **Arrange wall** in the settings reopens arranging later. Cards are saved in the browser with the other settings.

## Backgrounds

```
backgrounds/<file>.{jpg,jpeg,png,webp,avif}
```

- Each file becomes a wall option (`cover`, centered), listed before the painted presets in `src/content/orthodox.ts`. Resized to at most 2560px wide at build.
- The first background in the list is the default for new visitors.

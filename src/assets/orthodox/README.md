# Orthodox screensaver images

Images here are picked up at build time by `src/lib/orthodox/assets.ts`. Nothing needs registering.

## Icons

```
icons/<collection>/<file>.{jpg,jpeg,png,webp,avif,svg}
```

- Each folder is a collection, listed in the screensaver's **Collection** picker. **All** combines every folder.
- The folder name becomes the label (`great-feasts` → "Great Feasts"). Override it in `collectionLabels` in `src/content/orthodox.ts`.
- The file name becomes the alt text. A leading number is dropped, so `03-st-nicholas.jpg` reads "St Nicholas". Use the number to keep files in order.
- Boards are 3:4 portrait. Other shapes are cropped from the bottom (`object-position: center top`), so leave room under the figure.
- Keep files reasonably sized (about 1200px on the long edge, WebP or JPEG). They are served as-is and not resized.
- `placeholder-saints/` and `placeholder-feasts/` are generated stand-ins. Delete them once real collections exist.

## Backgrounds

```
backgrounds/<file>.{jpg,jpeg,png,webp,avif}
```

- Each file becomes a wall option (`cover`, centered), listed before the painted presets in `src/content/orthodox.ts`.
- The first background in the list is the default for new visitors.

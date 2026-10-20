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
- Full-size originals are fine. At build, each raster icon is resized to at most 1200px wide and converted to WebP; SVGs are served as-is.

## Backgrounds

```
backgrounds/<file>.{jpg,jpeg,png,webp,avif}
```

- Each file becomes a wall option (`cover`, centered), listed before the painted presets in `src/content/orthodox.ts`. Resized to at most 2560px wide at build.
- The first background in the list is the default for new visitors.

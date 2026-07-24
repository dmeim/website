export type RectLike = {
  left: number;
  width: number;
  top?: number;
  height?: number;
};

export type MeasuredThumbVars = {
  x: number;
  w: number;
};

export type SlidingThumbSyncOptions = {
  /** Selector for option elements within root. Default: `.sliding-thumb__option` */
  optionSelector?: string;
  /**
   * Active option within root. Default:
   * `[aria-current="page"], [aria-checked="true"]`
   */
  activeSelector?: string;
  /** Horizontal inset applied to measured thumb width/position (px). Default: 0 */
  inset?: number;
};

export type SlidingThumbMountOptions = SlidingThumbSyncOptions;

/**
 * Pure geometry for measured-mode CSS vars.
 *
 * `x` / `w` are relative to the root’s **padding edge** (abspos containing
 * block origin), not the border box. Callers must pass `clientLeft` (border +
 * scrollbar gutter on the left) so a bordered track does not shift the thumb
 * right by the border width — which reads as left-biased label text inside
 * the pill.
 */
export function computeMeasuredThumbVars(
  rootBox: RectLike,
  optionBox: RectLike,
  inset = 0,
  clientLeft = 0,
): MeasuredThumbVars {
  const safeInset = Math.max(0, inset);
  const safeClientLeft = Math.max(0, clientLeft);
  const rawW = Math.max(0, optionBox.width - safeInset * 2);
  const x =
    optionBox.left - rootBox.left - safeClientLeft + safeInset;
  return { x, w: rawW };
}

function queryActiveOption(
  root: HTMLElement,
  options: SlidingThumbSyncOptions,
): HTMLElement | null {
  const optionSelector = options.optionSelector ?? ".sliding-thumb__option";
  const activeSelector =
    options.activeSelector ??
    '[aria-current="page"], [aria-checked="true"]';

  const active = root.querySelector<HTMLElement>(activeSelector);
  if (active && root.contains(active)) return active;

  return root.querySelector<HTMLElement>(optionSelector);
}

/**
 * Size/position the measured-mode thumb from the active option’s box.
 * No-op when the root is not `.sliding-thumb--measured` or has no option.
 */
export function syncSlidingThumb(
  root: HTMLElement,
  options: SlidingThumbSyncOptions = {},
): void {
  if (!root.classList.contains("sliding-thumb--measured")) return;

  const option = queryActiveOption(root, options);
  if (!option) {
    root.style.setProperty("--sliding-thumb-x", "0px");
    root.style.setProperty("--sliding-thumb-w", "0px");
    return;
  }

  const rootBox = root.getBoundingClientRect();
  const optionBox = option.getBoundingClientRect();
  const { x, w } = computeMeasuredThumbVars(
    rootBox,
    optionBox,
    options.inset ?? 0,
    root.clientLeft,
  );

  root.style.setProperty("--sliding-thumb-x", `${x}px`);
  root.style.setProperty("--sliding-thumb-w", `${w}px`);
}

/**
 * Keep a measured sliding thumb in sync with layout and fonts.
 * Returns a dispose function.
 */
export function mountSlidingThumb(
  root: HTMLElement,
  options: SlidingThumbMountOptions = {},
): () => void {
  const sync = () => syncSlidingThumb(root, options);
  sync();

  const resizeObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => sync())
      : null;
  resizeObserver?.observe(root);

  window.addEventListener("resize", sync);

  let disposed = false;
  const fontsReady =
    typeof document !== "undefined" && document.fonts?.ready
      ? document.fonts.ready.then(() => {
          if (!disposed) sync();
        })
      : null;
  void fontsReady;

  return () => {
    disposed = true;
    resizeObserver?.disconnect();
    window.removeEventListener("resize", sync);
  };
}

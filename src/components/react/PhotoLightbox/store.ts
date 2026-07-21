export type PhotoLightboxItem = {
  src: string;
  alt?: string;
  caption?: string;
};

export type PhotoOriginRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type OpenPhotoOptions = PhotoLightboxItem & {
  /** Gallery only — ordered set for prev/next + swipe. */
  items?: PhotoLightboxItem[];
  index?: number;
  /**
   * Id used to ghost the page trigger while open.
   * Must match SharedPhotoShell's layoutId.
   */
  layoutId?: string;
  /** Screen rect of the clicked photo — drives the pick-up / put-down FLIP. */
  origin?: PhotoOriginRect;
};

export type PhotoLightboxState = {
  open: boolean;
  src: string;
  alt: string;
  caption: string;
  layoutId: string;
  origin: PhotoOriginRect | null;
  items: PhotoLightboxItem[] | null;
  index: number;
};

type Listener = (state: PhotoLightboxState) => void;

const listeners = new Set<Listener>();

let state: PhotoLightboxState = {
  open: false,
  src: "",
  alt: "",
  caption: "",
  layoutId: "",
  origin: null,
  items: null,
  index: 0,
};

function emit() {
  for (const listener of listeners) listener(state);
}

/** Stable id for a photo trigger / lightbox pair (ghost matching). */
export function photoLayoutId(src: string, key?: string | number) {
  const safeSrc = src.replace(/[^a-zA-Z0-9_-]+/g, "-");
  if (key !== undefined && key !== "") {
    const safeKey = String(key).replace(/[^a-zA-Z0-9_-]+/g, "-");
    return `photo-${safeKey}-${safeSrc}`;
  }
  return `photo-${safeSrc}`;
}

export function measurePhotoOrigin(el: Element): PhotoOriginRect {
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function applyItem(
  item: PhotoLightboxItem,
  index: number,
  items: PhotoLightboxItem[] | null,
  layoutId: string,
  origin: PhotoOriginRect | null,
) {
  state = {
    open: true,
    src: item.src,
    alt: item.alt?.trim() || "",
    caption: item.caption?.trim() || "",
    layoutId,
    origin,
    items,
    index,
  };
  emit();
}

/** Island-safe open API — works across separate Astro React trees. */
export function openPhoto(options: OpenPhotoOptions) {
  const items =
    options.items && options.items.length > 0 ? options.items : null;
  const index = items
    ? Math.min(Math.max(options.index ?? 0, 0), items.length - 1)
    : 0;
  const item = items ? items[index]! : options;
  const layoutId =
    options.layoutId?.trim() ||
    photoLayoutId(item.src, items ? index : undefined);
  applyItem(item, index, items, layoutId, options.origin ?? null);
}

export function closePhoto() {
  if (!state.open) return;
  state = { ...state, open: false };
  emit();
}

export function showPhotoAt(index: number) {
  if (!state.open || !state.items?.length) return;
  const next =
    ((index % state.items.length) + state.items.length) % state.items.length;
  const item = state.items[next]!;
  // Keep origin as the opener's rect for put-down; nav only swaps the image.
  applyItem(
    item,
    next,
    state.items,
    photoLayoutId(item.src, next),
    state.origin,
  );
}

export function showPrevPhoto() {
  showPhotoAt(state.index - 1);
}

export function showNextPhoto() {
  showPhotoAt(state.index + 1);
}

export function getPhotoLightboxState() {
  return state;
}

export function subscribePhotoLightbox(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

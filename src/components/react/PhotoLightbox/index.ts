import {
  measurePhotoOrigin,
  openPhoto,
  type OpenPhotoOptions,
} from "./store";

export { default as PhotoLightbox } from "./PhotoLightbox";
export { SharedPhotoShell } from "./SharedPhotoShell";
export {
  openPhoto,
  closePhoto,
  showPrevPhoto,
  showNextPhoto,
  photoLayoutId,
  measurePhotoOrigin,
  type PhotoLightboxItem,
  type OpenPhotoOptions,
  type PhotoOriginRect,
} from "./store";
export {
  usePhotoLightboxState,
  useLiftedPhotoLayoutId,
} from "./usePhotoLightboxState";

/** Measure the trigger's photo shell and open the lightbox with that origin. */
export function openPhotoFromEvent(
  event: { currentTarget: Element },
  options: Omit<OpenPhotoOptions, "origin">,
) {
  const shell =
    event.currentTarget.querySelector("[data-photo-shell]") ??
    event.currentTarget;
  openPhoto({
    ...options,
    origin: measurePhotoOrigin(shell),
  });
}

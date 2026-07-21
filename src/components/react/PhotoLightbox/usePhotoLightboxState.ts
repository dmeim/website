import { useSyncExternalStore } from "react";
import {
  getPhotoLightboxState,
  subscribePhotoLightbox,
  type PhotoLightboxState,
} from "./store";

export function usePhotoLightboxState(): PhotoLightboxState {
  return useSyncExternalStore(
    subscribePhotoLightbox,
    getPhotoLightboxState,
    getPhotoLightboxState,
  );
}

/** `layoutId` of the photo currently lifted into the lightbox, or null. */
export function useLiftedPhotoLayoutId(): string | null {
  const state = usePhotoLightboxState();
  return state.open && state.layoutId ? state.layoutId : null;
}

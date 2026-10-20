import { useCallback, useEffect, useState } from "react";

// Safari (iPad) still ships the prefixed API; iPhone has none.
type FullscreenDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
};

function fullscreenElement(): Element | null {
  const doc = document as FullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export async function exitFullscreen(): Promise<void> {
  if (!fullscreenElement()) return;
  const doc = document as FullscreenDocument;
  await (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
}

async function enterFullscreen(): Promise<void> {
  // The whole document goes fullscreen so it survives client-side navigation.
  const el = document.documentElement as FullscreenElement;
  await (el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.());
}

export function useFullscreen() {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const doc = document as FullscreenDocument;
    setSupported(Boolean(doc.fullscreenEnabled || doc.webkitFullscreenEnabled));
    const sync = () => setActive(fullscreenElement() !== null);
    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (fullscreenElement()) await exitFullscreen();
      else await enterFullscreen();
    } catch (error) {
      console.warn("[orthodox] fullscreen toggle failed", error);
    }
  }, []);

  return { supported, active, toggle };
}

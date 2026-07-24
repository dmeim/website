import { mountSlidingThumb } from "./sliding-thumb";

let dispose: (() => void) | null = null;

function mountSiteNavThumb(): void {
  const root = document.querySelector<HTMLElement>(".site-nav.sliding-thumb");
  dispose?.();
  dispose = null;
  if (!root) return;
  dispose = mountSlidingThumb(root);
}

mountSiteNavThumb();
document.addEventListener("astro:page-load", mountSiteNavThumb);

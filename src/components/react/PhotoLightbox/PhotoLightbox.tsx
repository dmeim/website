import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { PhotoTilt } from "../../motion";
import {
  closePhoto,
  measurePhotoOrigin,
  showNextPhoto,
  showPrevPhoto,
  type PhotoOriginRect,
} from "./store";
import { usePhotoLightboxState } from "./usePhotoLightboxState";
import "./PhotoLightbox.css";

const EASE = [0.22, 1, 0.36, 1] as const;
const SWIPE_THRESHOLD = 56;
const FLIP_DURATION = 0.48;

/** Set true to re-enable pick-up / put-down FLIP morph. */
const ENABLE_OPEN_CLOSE_ANIMATION = false;

type FlipPose = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
};

function flipFromRects(first: PhotoOriginRect, last: DOMRect): FlipPose {
  return {
    x:
      first.left +
      first.width / 2 -
      (last.left + last.width / 2),
    y:
      first.top +
      first.height / 2 -
      (last.top + last.height / 2),
    scaleX: first.width / Math.max(last.width, 1),
    scaleY: first.height / Math.max(last.height, 1),
  };
}

function readOrigin(layoutId: string, fallback: PhotoOriginRect | null) {
  const el = document.querySelector(
    `[data-photo-shell="${CSS.escape(layoutId)}"]`,
  );
  if (el) return measurePhotoOrigin(el);
  return fallback;
}

export default function PhotoLightbox() {
  const state = usePhotoLightboxState();
  const prefersReducedMotion = useReducedMotion();
  /** Skip pick-up / put-down FLIP + open/close fades. Flip code stays below. */
  const skipOpenCloseAnim =
    Boolean(prefersReducedMotion) || !ENABLE_OPEN_CLOSE_ANIMATION;
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);
  const navigable = Boolean(state.items && state.items.length > 1);
  const [mounted, setMounted] = useState(false);
  const [tiltReady, setTiltReady] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [closing, setClosing] = useState(false);
  const openGen = useRef(0);
  const navLock = useRef(false);
  const didOpenFlip = useRef(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!state.open) {
      setTiltReady(false);
      setFlipping(false);
      setClosing(false);
      didOpenFlip.current = false;
      openGen.current += 1; // invalidate in-flight flip promises
      navLock.current = false;
      x.set(0);
      y.set(0);
      scaleX.set(1);
      scaleY.set(1);
      document.documentElement.classList.remove("photo-lightbox-open");
      return;
    }

    setTiltReady(skipOpenCloseAnim); // skip FLIP → ready immediately
    setClosing(false);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("photo-lightbox-open");
    closeRef.current?.focus();

    return () => {
      document.documentElement.classList.remove("photo-lightbox-open");
      document.body.style.overflow = previousOverflow;
    };
  }, [state.open, skipOpenCloseAnim, x, y, scaleX, scaleY]);

  // Pick-up: measure resting layout, snap to origin FLIP, animate to identity.
  useLayoutEffect(() => {
    if (!state.open || closing || skipOpenCloseAnim || didOpenFlip.current) return;

    const frame = frameRef.current;
    const origin = state.origin;
    if (!frame) return;

    didOpenFlip.current = true;
    const gen = ++openGen.current;
    setFlipping(true);

    // Measure at identity (no visibility:hidden — that was leaving the photo blank).
    x.set(0);
    y.set(0);
    scaleX.set(1);
    scaleY.set(1);

    const last = frame.getBoundingClientRect();
    if (
      !origin ||
      origin.width < 1 ||
      origin.height < 1 ||
      last.width < 1 ||
      last.height < 1
    ) {
      setFlipping(false);
      setTiltReady(true);
      return;
    }

    const from = flipFromRects(origin, last);
    x.set(from.x);
    y.set(from.y);
    scaleX.set(from.scaleX);
    scaleY.set(from.scaleY);

    const controls = [
      animate(x, 0, { duration: FLIP_DURATION, ease: EASE }),
      animate(y, 0, { duration: FLIP_DURATION, ease: EASE }),
      animate(scaleX, 1, { duration: FLIP_DURATION, ease: EASE }),
      animate(scaleY, 1, { duration: FLIP_DURATION, ease: EASE }),
    ];

    void Promise.all(controls.map((c) => c.finished)).then(() => {
      if (openGen.current !== gen) return;
      setFlipping(false);
      setTiltReady(true);
    });
  }, [state.open, state.origin, state.src, closing, skipOpenCloseAnim, x, y, scaleX, scaleY]);

  useEffect(() => {
    if (!state.open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        beginClose();
        return;
      }
      if (!navigable || closing || flipping) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigate("prev");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        navigate("next");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.open, navigable, closing, flipping]);

  function beginClose() {
    if (!state.open || closing) return;
    setTiltReady(false);
    setClosing(true);
    setFlipping(true);

    if (skipOpenCloseAnim || !frameRef.current) {
      setClosing(false);
      closePhoto();
      return;
    }

    const origin = readOrigin(state.layoutId, state.origin);
    if (!origin || origin.width < 1 || origin.height < 1) {
      setClosing(false);
      closePhoto();
      return;
    }

    // Ensure resting transform before measuring / animating put-down.
    x.set(0);
    y.set(0);
    scaleX.set(1);
    scaleY.set(1);
    const last = frameRef.current.getBoundingClientRect();
    const to = flipFromRects(origin, last);
    const gen = openGen.current;

    const controls = [
      animate(x, to.x, { duration: FLIP_DURATION, ease: EASE }),
      animate(y, to.y, { duration: FLIP_DURATION, ease: EASE }),
      animate(scaleX, to.scaleX, { duration: FLIP_DURATION, ease: EASE }),
      animate(scaleY, to.scaleY, { duration: FLIP_DURATION, ease: EASE }),
    ];

    void Promise.all(controls.map((c) => c.finished)).then(() => {
      if (openGen.current !== gen) return;
      setFlipping(false);
      setClosing(false);
      closePhoto();
    });
  }

  function navigate(direction: "prev" | "next") {
    if (!navigable || navLock.current || !state.open || closing || flipping) {
      return;
    }
    navLock.current = true;
    setTiltReady(false);
    if (direction === "prev") showPrevPhoto();
    else showNextPhoto();
    requestAnimationFrame(() => {
      setTiltReady(true);
      navLock.current = false;
    });
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!navigable || event.pointerType === "mouse" || closing) return;
    dragStartX.current = event.clientX;
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragStartX.current == null) return;
    const delta = event.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    if (delta > 0) navigate("prev");
    else navigate("next");
  }

  function onPointerCancel() {
    dragStartX.current = null;
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {state.open ? (
        <div
          className="photo-lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <motion.button
            type="button"
            className="photo-lightbox__backdrop"
            aria-label="Close photo"
            onClick={beginClose}
            initial={skipOpenCloseAnim ? false : { opacity: 0 }}
            animate={{ opacity: closing ? 0 : 1 }}
            exit={skipOpenCloseAnim ? undefined : { opacity: 0 }}
            transition={{
              duration: skipOpenCloseAnim ? 0.01 : FLIP_DURATION,
              ease: EASE,
            }}
          />

          <div className="photo-lightbox__chrome">
            <motion.div
              className="photo-lightbox__chrome-inner"
              initial={skipOpenCloseAnim ? false : { opacity: 0 }}
              animate={{ opacity: closing ? 0 : 1 }}
              exit={skipOpenCloseAnim ? undefined : { opacity: 0 }}
              transition={{
                duration: skipOpenCloseAnim ? 0.01 : FLIP_DURATION,
                ease: EASE,
              }}
            >
              <button
                ref={closeRef}
                type="button"
                className="photo-lightbox__close"
                aria-label="Close photo"
                onClick={beginClose}
              >
                <span aria-hidden="true">&times;</span>
              </button>

              {navigable ? (
                <button
                  type="button"
                  className="photo-lightbox__nav photo-lightbox__nav--prev"
                  aria-label="Previous photo"
                  onClick={() => navigate("prev")}
                >
                  <span aria-hidden="true">‹</span>
                </button>
              ) : null}

              {navigable ? (
                <button
                  type="button"
                  className="photo-lightbox__nav photo-lightbox__nav--next"
                  aria-label="Next photo"
                  onClick={() => navigate("next")}
                >
                  <span aria-hidden="true">›</span>
                </button>
              ) : null}
            </motion.div>
          </div>

          <div
            className="photo-lightbox__stage"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
          >
            <div className="photo-lightbox__figure">
              <span id={titleId} className="photo-lightbox__sr-only">
                {state.alt || "Photo preview"}
              </span>
              <motion.div
                ref={frameRef}
                className="photo-lightbox__frame"
                style={{ x, y, scaleX, scaleY, transformOrigin: "center center" }}
              >
                <PhotoTilt
                  className="photo-lightbox__tilt"
                  intensity="main"
                  enabled={tiltReady && !prefersReducedMotion && !closing && !flipping}
                >
                  <div className="photo-lightbox__clip">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.img
                        key={state.src}
                        className="photo-lightbox__img"
                        src={state.src}
                        alt={state.alt}
                        decoding="async"
                        draggable={false}
                        onClick={() => {
                          if (!state.src) return;
                          window.open(state.src, "_blank", "noopener,noreferrer");
                        }}
                        initial={false}
                        animate={{ opacity: 1 }}
                        exit={
                          skipOpenCloseAnim ? undefined : { opacity: 0 }
                        }
                        transition={{
                          duration: skipOpenCloseAnim ? 0.01 : 0.28,
                          ease: EASE,
                        }}
                      />
                    </AnimatePresence>
                  </div>
                </PhotoTilt>
              </motion.div>
              <AnimatePresence mode="wait" initial={false}>
                {state.caption ? (
                  <motion.p
                    key={state.caption + state.src}
                    className="photo-lightbox__caption"
                    initial={skipOpenCloseAnim ? false : { opacity: 0, y: 6 }}
                    animate={{
                      opacity: tiltReady && !closing ? 1 : 0,
                    }}
                    exit={skipOpenCloseAnim ? undefined : { opacity: 0 }}
                    transition={{
                      duration: skipOpenCloseAnim ? 0.01 : 0.28,
                      ease: EASE,
                    }}
                  >
                    {state.caption}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

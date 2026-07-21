import type { CSSProperties, ReactNode } from "react";
import { useLiftedPhotoLayoutId } from "./usePhotoLightboxState";
import "./PhotoLightbox.css";

type SharedPhotoShellProps = {
  layoutId: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * Page-side photo shell. While its photo is in the lightbox it stays mounted
 * (invisible) so layout doesn't collapse and close can re-measure put-down.
 */
export function SharedPhotoShell({
  layoutId,
  children,
  className,
  style,
}: SharedPhotoShellProps) {
  const lifted = useLiftedPhotoLayoutId() === layoutId;
  const shellClass = ["photo-shared-shell", className].filter(Boolean).join(" ");

  return (
    <div
      className={shellClass}
      data-photo-shell={layoutId}
      style={{
        ...style,
        opacity: lifted ? 0 : 1,
        pointerEvents: lifted ? "none" : style?.pointerEvents,
      }}
      aria-hidden={lifted || undefined}
    >
      {children}
    </div>
  );
}

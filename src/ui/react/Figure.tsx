import type { ComponentPropsWithRef, CSSProperties } from "react";
import { cx } from "@/ui/lib/cx";

export type FigureProps = Omit<ComponentPropsWithRef<"figure">, "children"> & {
  src: string;
  alt: string;
  caption?: string;
  ratio?: string;
  frame?: boolean;
  priority?: boolean;
};

export function Figure({ src, alt, caption, ratio, frame = false, priority = false, className, style, ...rest }: FigureProps) {
  const ratioStyle = ratio ? ({ "--ui-figure-ratio": ratio } as CSSProperties) : undefined;
  return (
    <figure
      className={cx("ui-figure", className)}
      data-frame={frame ? "true" : undefined}
      data-ratio={ratio ? "true" : undefined}
      style={{ ...ratioStyle, ...style }}
      {...rest}
    >
      <div className="ui-figure__media">
        <img
          className="ui-figure__img"
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : undefined}
        />
      </div>
      {caption && <figcaption className="ui-figure__caption">{caption}</figcaption>}
    </figure>
  );
}

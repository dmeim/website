import type { SVGProps } from "react";
import { islandGlyphs } from "./glyphs-island";
import type { IconWeight, IslandIconName } from "./registry";

export type IconProps = {
  name: IslandIconName;
  /** Pixel number or CSS length. Defaults to 1em so the icon follows font size. */
  size?: number | string;
  weight?: IconWeight;
  /** Flip horizontally (e.g. for RTL-sensitive arrows). */
  mirrored?: boolean;
  /**
   * Accessible name. When set the icon is announced (role="img");
   * when omitted the icon is decorative (aria-hidden).
   */
  label?: string;
  className?: string;
} & Omit<
  SVGProps<SVGSVGElement>,
  "ref" | "children" | "name" | "width" | "height" | "fill" | "aria-label" | "aria-hidden" | "role"
>;

/**
 * Phosphor icon for React islands. Only islandIconNames are available here,
 * so the browser bundle carries just their path data (see registry.ts).
 */
export function Icon({
  name,
  size = "1em",
  weight = "regular",
  mirrored = false,
  label,
  className,
  ...rest
}: IconProps) {
  const classes = className ? `ui-icon ${className}` : "ui-icon";
  const a11y = label
    ? { role: "img", "aria-label": label }
    : { "aria-hidden": true as const };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="currentColor"
      viewBox="0 0 256 256"
      transform={mirrored ? "scale(-1, 1)" : undefined}
      className={classes}
      focusable="false"
      data-icon={name}
      {...a11y}
      {...rest}
      dangerouslySetInnerHTML={{ __html: islandGlyphs[name][weight] }}
    />
  );
}

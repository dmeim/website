import { createElement, type SVGProps } from "react";
import type { IconNode } from "lucide";

type LucideIconProps = {
  icon: IconNode;
  size?: number;
} & Omit<SVGProps<SVGSVGElement>, "children" | "ref">;

export function LucideIcon({
  icon,
  size = 18,
  className,
  ...props
}: LucideIconProps) {
  return createElement(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": true,
      className,
      ...props,
    },
    ...icon.map(([tag, attrs], index) =>
      createElement(tag, { key: index, ...attrs }),
    ),
  );
}

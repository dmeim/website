import { m, useReducedMotion } from "framer-motion";
import { MotionRoot } from "./MotionRoot";
import { Children, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { fadeUp, stagger as staggerVariants } from "@/ui/lib/motion";

export type ToolFrameProps = {
  layout?: "single" | "split" | "stack";
  stagger?: boolean;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

export function ToolFrame({ layout = "single", stagger = false, className, children, ...rest }: ToolFrameProps) {
  const reduced = useReducedMotion();
  const props = { ...rest, className: cx("ui-tool-frame", className), "data-layout": layout };
  if (!stagger || reduced) return <div {...props}>{children}</div>;
  return (
    <MotionRoot>
      <m.div {...(props as object)} initial="hidden" animate="visible" variants={staggerVariants(0.06)}>
        {Children.toArray(children).map((child, index) => (
          <m.div key={index} className="ui-tool-frame__item" variants={fadeUp}>
            {child}
          </m.div>
        ))}
      </m.div>
    </MotionRoot>
  );
}

import type { HTMLAttributes, Ref } from "react";
import { cx } from "@/ui/lib/cx";

export type DividerProps = HTMLAttributes<HTMLElement> & {
  orientation?: "horizontal" | "vertical";
  label?: string;
  ref?: Ref<HTMLElement>;
};

export function Divider({ orientation = "horizontal", label, className, ref, ...rest }: DividerProps) {
  const classes = cx("ui-divider", className);
  if (label) {
    return (
      <div ref={ref as Ref<HTMLDivElement>} className={classes} role="separator" aria-label={label} data-orientation={orientation} data-labelled="" {...rest}>
        <span className="ui-divider__label" aria-hidden="true">{label}</span>
      </div>
    );
  }
  if (orientation === "vertical") {
    return <div ref={ref as Ref<HTMLDivElement>} className={classes} role="separator" aria-orientation="vertical" data-orientation="vertical" {...rest} />;
  }
  return <hr ref={ref as Ref<HTMLHRElement>} className={classes} data-orientation="horizontal" {...rest} />;
}

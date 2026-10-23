import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { cx } from "@/ui/lib/cx";
import { useStableId } from "@/ui/lib/ids";
import { bindTooltipEscape } from "@/ui/lib/tooltip";

export type TooltipPlacement = "top" | "bottom" | "start" | "end";

export type TooltipProps = {
  content: string;
  placement?: TooltipPlacement;
  /** Show delay in ms. */
  delay?: number;
  children: ReactNode;
  ref?: Ref<HTMLSpanElement>;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children" | "content">;

type TriggerProps = { "aria-describedby"?: string; "aria-label"?: string };

export function Tooltip({ content, placement = "top", delay, children, className, style, id, ...rest }: TooltipProps) {
  const tipId = useStableId(id, "ui-tooltip");
  useEffect(bindTooltipEscape, []);

  const only = Children.count(children) === 1 ? Children.toArray(children)[0] : null;
  // Skip describedby when the trigger is already named by the same text (IconButton).
  const trigger =
    isValidElement<TriggerProps>(only) && only.props["aria-label"] !== content
      ? cloneElement(only as ReactElement<TriggerProps>, {
          "aria-describedby": cx(only.props["aria-describedby"], tipId),
        })
      : children;
  const vars = delay === undefined ? style : ({ ...style, "--ui-tooltip-delay": `${delay}ms` } as CSSProperties);

  return (
    <span
      className={cx("ui-tooltip", className)}
      data-placement={placement}
      style={vars}
      onMouseLeave={(e) => delete e.currentTarget.dataset.dismissed}
      onBlur={(e) => delete e.currentTarget.dataset.dismissed}
      {...rest}
    >
      {trigger}
      <span role="tooltip" id={tipId} className="ui-tooltip__bubble">
        {content}
      </span>
    </span>
  );
}

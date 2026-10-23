import {
  cloneElement,
  useCallback,
  useRef,
  useState,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { cx } from "@/ui/lib/cx";
import { useDismiss } from "@/ui/lib/dismiss";
import { useStableId } from "@/ui/lib/ids";

export type PopoverPlacement = "top" | "bottom" | "top-start" | "bottom-start" | "top-end" | "bottom-end";

type TriggerProps = {
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  "aria-haspopup"?: "dialog";
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  ref?: Ref<HTMLElement>;
};

export type PopoverProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger: ReactElement;
  placement?: PopoverPlacement;
  label: string;
  children?: ReactNode;
  ref?: Ref<HTMLSpanElement>;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children">;

export function Popover({
  open: openProp,
  onOpenChange,
  trigger,
  placement = "bottom-start",
  label,
  className,
  id,
  children,
  ...rest
}: PopoverProps) {
  const contentId = useStableId(id, "ui-popover");
  const [inner, setInner] = useState(false);
  const open = openProp ?? inner;
  const wrapper = useRef<HTMLSpanElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInner(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );
  const onDismiss = useCallback(
    (reason: "outside" | "escape") => {
      setOpen(false);
      if (reason === "escape") triggerRef.current?.focus();
    },
    [setOpen],
  );
  useDismiss(open, wrapper, onDismiss);

  const triggerEl = trigger as ReactElement<TriggerProps>;
  const triggerNode = cloneElement(triggerEl, {
    "aria-expanded": open,
    "aria-controls": contentId,
    "aria-haspopup": "dialog",
    ref: (el: HTMLElement | null) => {
      triggerRef.current = el;
    },
    onClick: (event: MouseEvent<HTMLElement>) => {
      triggerEl.props.onClick?.(event);
      if (!event.defaultPrevented) setOpen(!open);
    },
  });

  return (
    <span ref={wrapper} {...rest} className={cx("ui-popover", className)} data-placement={placement} data-state={open ? "open" : "closed"}>
      {triggerNode}
      <div id={contentId} className="ui-popover__content" role="dialog" aria-label={label} hidden={!open}>
        {children}
      </div>
    </span>
  );
}

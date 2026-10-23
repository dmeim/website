import { useEffect, useRef, type HTMLAttributes, type Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { handleRovingKey, syncRovingTabindex } from "@/ui/lib/roving-focus";

export type ToolbarProps = {
  label: string;
  orientation?: "horizontal" | "vertical";
  placement?: "inline" | "floating-top" | "floating-bottom";
  ref?: Ref<HTMLDivElement>;
} & HTMLAttributes<HTMLDivElement>;

export function Toolbar({
  label,
  orientation = "horizontal",
  placement = "inline",
  className,
  children,
  onKeyDown,
  onFocus,
  ref,
  ...rest
}: ToolbarProps) {
  const inner = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (inner.current) syncRovingTabindex(inner.current);
  });

  const setRef = (node: HTMLDivElement | null) => {
    inner.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <div
      ref={setRef}
      role="toolbar"
      aria-label={label}
      aria-orientation={orientation}
      {...rest}
      className={cx("ui-toolbar", className)}
      data-placement={placement}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) handleRovingKey(event.currentTarget, event.nativeEvent);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        syncRovingTabindex(event.currentTarget, event.target as HTMLElement);
      }}
    >
      {children}
    </div>
  );
}

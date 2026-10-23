import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { useStableId } from "@/ui/lib/ids";
import { focusableIn, lockScroll, trapTab } from "@/ui/lib/overlay";
import { IconButton } from "./IconButton";

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  side?: "start" | "end" | "bottom";
  title: string;
  titleHidden?: boolean;
  /** Defaults to true below the 960px breakpoint, false above it. */
  modal?: boolean;
  width?: string;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
} & Omit<HTMLAttributes<HTMLDivElement>, "title">;

const NARROW = "(max-width: 959px)";

function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(true);
  useEffect(() => {
    const query = window.matchMedia(NARROW);
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return narrow;
}

export function Drawer({
  open,
  onClose,
  side = "start",
  title,
  titleHidden = false,
  modal,
  width,
  className,
  id,
  style,
  children,
  ...rest
}: DrawerProps) {
  const baseId = useStableId(id, "ui-drawer");
  const narrow = useNarrow();
  const isModal = modal ?? narrow;
  const panel = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const unlock = isModal ? lockScroll() : undefined;
    const el = panel.current;
    if (el) (focusableIn(el)[0] ?? el).focus();
    return () => {
      unlock?.();
      if (el?.contains(document.activeElement) || document.activeElement === document.body) opener?.focus();
    };
  }, [open, isModal]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onCloseRef.current();
      return;
    }
    if (isModal && panel.current) trapTab(panel.current, event.nativeEvent);
  };

  const vars = width ? ({ ...style, "--ui-drawer-width": width } as CSSProperties) : style;

  return (
    <div
      {...rest}
      id={baseId}
      className={cx("ui-drawer", className)}
      data-side={side}
      data-modal={isModal ? undefined : "false"}
      data-state={open ? "open" : "closed"}
      inert={!open}
      style={vars}
      onKeyDown={onKeyDown}
    >
      {isModal && <div className="ui-drawer__scrim" aria-hidden="true" onClick={() => onCloseRef.current()} />}
      <div
        ref={panel}
        className="ui-drawer__panel"
        role="dialog"
        aria-modal={isModal || undefined}
        aria-labelledby={`${baseId}-title`}
        tabIndex={-1}
      >
        <header className="ui-drawer__header">
          <h2 id={`${baseId}-title`} className={titleHidden ? "ui-visually-hidden" : "ui-drawer__title"}>
            {title}
          </h2>
          <IconButton icon="x" label="Close" size="sm" tooltip={false} className="ui-drawer__close" onClick={() => onCloseRef.current()} />
        </header>
        <div className="ui-drawer__body">{children}</div>
      </div>
    </div>
  );
}

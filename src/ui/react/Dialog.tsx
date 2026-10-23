import { useEffect, useRef, type HTMLAttributes, type MouseEvent, type ReactNode, type Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { useStableId } from "@/ui/lib/ids";
import { ButtonGroup } from "./ButtonGroup";
import { IconButton } from "./IconButton";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  titleHidden?: boolean;
  description?: ReactNode;
  size?: "sm" | "md" | "lg" | "full";
  footer?: ReactNode;
  closeLabel?: string;
  dismissible?: boolean;
  children?: ReactNode;
  ref?: Ref<HTMLDialogElement>;
} & Omit<HTMLAttributes<HTMLDialogElement>, "title" | "open">;

export function Dialog({
  open,
  onClose,
  title,
  titleHidden = false,
  description,
  size = "md",
  footer,
  closeLabel = "Close",
  dismissible = true,
  className,
  id,
  children,
  ref,
  ...rest
}: DialogProps) {
  const baseId = useStableId(id, "ui-dialog");
  const node = useRef<HTMLDialogElement | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = node.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = node.current;
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  const setRef = (el: HTMLDialogElement | null) => {
    node.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };

  const onBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget && dismissible) onCloseRef.current();
  };

  return (
    <dialog
      {...rest}
      ref={setRef}
      id={baseId}
      className={cx("ui-dialog", className)}
      data-size={size}
      aria-labelledby={`${baseId}-title`}
      aria-describedby={description ? `${baseId}-desc` : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onCloseRef.current();
      }}
      onClose={() => {
        opener.current?.focus();
        opener.current = null;
        if (open) onCloseRef.current();
      }}
      onClick={onBackdrop}
    >
      <div className="ui-dialog__panel">
        <header className="ui-dialog__header">
          <h2 id={`${baseId}-title`} className={titleHidden ? "ui-visually-hidden" : "ui-dialog__title"}>
            {title}
          </h2>
          {dismissible && (
            <IconButton icon="x" label={closeLabel} size="sm" tooltip={false} className="ui-dialog__close" onClick={() => onCloseRef.current()} />
          )}
        </header>
        {description && (
          <div id={`${baseId}-desc`} className="ui-dialog__description">
            {description}
          </div>
        )}
        <div className="ui-dialog__body">{children}</div>
        {footer && (
          <footer className="ui-dialog__footer">
            <ButtonGroup align="end">{footer}</ButtonGroup>
          </footer>
        )}
      </div>
    </dialog>
  );
}

import { useEffect, useRef, useState, type HTMLAttributes, type KeyboardEvent, type Ref } from "react";
import { Icon } from "@/ui/icons";
import { cx } from "@/ui/lib/cx";
import { dismiss, subscribe, type ToastItem } from "@/ui/lib/toast";
import { createToastTimer } from "@/ui/lib/toast-timer";
import { TONE_ICONS } from "@/ui/lib/tone-icons";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

export { toast, dismiss } from "@/ui/lib/toast";

export type ToasterProps = {
  label?: string;
  ref?: Ref<HTMLElement>;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

function Toast({ item }: { item: ToastItem }) {
  const timer = useRef<ReturnType<typeof createToastTimer> | null>(null);
  useEffect(() => {
    timer.current = createToastTimer(item.duration, () => dismiss(item.id));
    return () => timer.current?.clear();
  }, [item]);
  const pause = () => timer.current?.pause();
  const resume = (event: { currentTarget: HTMLElement; relatedTarget?: EventTarget | null }) => {
    const next = event.relatedTarget as Node | null;
    if (next && event.currentTarget.contains(next)) return;
    if (event.currentTarget.matches(":hover, :focus-within")) return;
    timer.current?.resume();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") dismiss(item.id);
  };
  return (
    <li
      className="ui-toast"
      role="status"
      data-tone={item.tone}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      onKeyDown={onKeyDown}
    >
      <Icon name={TONE_ICONS[item.tone]} weight="fill" className="ui-toast__icon" />
      <p className="ui-toast__message">{item.message}</p>
      {item.action && (
        <Button
          variant="ghost"
          size="sm"
          className="ui-toast__action"
          onClick={() => {
            item.action?.onClick();
            dismiss(item.id);
          }}
        >
          {item.action.label}
        </Button>
      )}
      <IconButton icon="x" label="Dismiss" size="sm" tooltip={false} className="ui-toast__close" onClick={() => dismiss(item.id)} />
    </li>
  );
}

export function Toaster({ label = "Notifications", className, ...rest }: ToasterProps) {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(
    () =>
      subscribe((event) => {
        setItems((current) =>
          event.type === "add" ? [...current, event.toast] : current.filter((item) => item.id !== event.id),
        );
      }),
    [],
  );
  return (
    <section aria-label={label} {...rest} className={cx("ui-toaster", className)}>
      <ol className="ui-toaster__list" aria-live="polite">
        {items.map((item) => (
          <Toast key={item.id} item={item} />
        ))}
      </ol>
    </section>
  );
}

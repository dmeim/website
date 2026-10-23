import {
  cloneElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type Ref,
} from "react";
import { Icon, type IconName } from "@/ui/icons";
import { cx } from "@/ui/lib/cx";
import { useDismiss } from "@/ui/lib/dismiss";
import { useStableId } from "@/ui/lib/ids";
import { Kbd } from "./Kbd";
import type { PopoverPlacement } from "./Popover";

export type MenuItem = {
  id: string;
  label: string;
  icon?: IconName;
  onSelect: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
  shortcut?: string[];
};

type TriggerProps = {
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  "aria-haspopup"?: "menu";
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  ref?: Ref<HTMLElement>;
};

export type MenuProps = {
  trigger: ReactElement;
  label: string;
  items: MenuItem[];
  placement?: PopoverPlacement;
  ref?: Ref<HTMLSpanElement>;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children">;

export function Menu({ trigger, label, items, placement = "bottom-start", className, id, ...rest }: MenuProps) {
  const menuId = useStableId(id, "ui-menu");
  const [open, setOpen] = useState(false);
  const [focusTarget, setFocusTarget] = useState<"first" | "last">("first");
  const wrapper = useRef<HTMLSpanElement | null>(null);
  const list = useRef<HTMLUListElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const typeahead = useRef({ text: "", at: 0 });

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);
  const onDismiss = useCallback((reason: "outside" | "escape") => close(reason === "escape"), [close]);
  useDismiss(open, wrapper, onDismiss);

  const enabled = () =>
    Array.from(list.current?.querySelectorAll<HTMLButtonElement>("[role='menuitem']:not(:disabled)") ?? []);

  useEffect(() => {
    if (!open) return;
    const all = enabled();
    (focusTarget === "first" ? all[0] : all[all.length - 1])?.focus();
  }, [open, focusTarget]);

  const openWith = (target: "first" | "last") => {
    setFocusTarget(target);
    setOpen(true);
  };

  const triggerEl = trigger as ReactElement<TriggerProps>;
  const triggerNode = cloneElement(triggerEl, {
    "aria-expanded": open,
    "aria-controls": menuId,
    "aria-haspopup": "menu",
    ref: (el: HTMLElement | null) => {
      triggerRef.current = el;
    },
    onClick: (event: MouseEvent<HTMLElement>) => {
      triggerEl.props.onClick?.(event);
      if (event.defaultPrevented) return;
      if (open) close(false);
      else openWith("first");
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      triggerEl.props.onKeyDown?.(event);
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        openWith(event.key === "ArrowDown" ? "first" : "last");
      }
    },
  });

  const onListKey = (event: KeyboardEvent<HTMLUListElement>) => {
    const all = enabled();
    const index = all.indexOf(document.activeElement as HTMLButtonElement);
    let next: HTMLButtonElement | undefined;
    if (event.key === "ArrowDown") next = all[(index + 1) % all.length];
    else if (event.key === "ArrowUp") next = all[index <= 0 ? all.length - 1 : index - 1];
    else if (event.key === "Home") next = all[0];
    else if (event.key === "End") next = all[all.length - 1];
    else if (event.key === "Tab") {
      close(false);
      return;
    } else if (event.key.length === 1 && /\S/.test(event.key) && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const now = Date.now();
      const state = typeahead.current;
      state.text = now - state.at > 500 ? event.key.toLowerCase() : state.text + event.key.toLowerCase();
      state.at = now;
      const ordered = [...all.slice(index + 1), ...all.slice(0, index + 1)];
      const pool = state.text.length === 1 ? ordered : [...all.slice(index), ...all.slice(0, index)];
      next = pool.find((el) => (el.textContent ?? "").trim().toLowerCase().startsWith(state.text));
    }
    if (next) {
      event.preventDefault();
      next.focus();
    }
  };

  return (
    <span ref={wrapper} {...rest} className={cx("ui-menu", className)} data-placement={placement} data-state={open ? "open" : "closed"}>
      {triggerNode}
      <ul ref={list} id={menuId} className="ui-menu__list" role="menu" aria-label={label} hidden={!open} onKeyDown={onListKey}>
        {items.map((item) => (
          <li key={item.id} role="none">
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              className="ui-menu__item"
              data-tone={item.tone === "danger" ? "danger" : undefined}
              disabled={item.disabled}
              onClick={() => {
                close(true);
                item.onSelect();
              }}
            >
              {item.icon && <Icon name={item.icon} className="ui-menu__icon" />}
              <span className="ui-menu__label">{item.label}</span>
              {item.shortcut && item.shortcut.length > 0 && <Kbd keys={item.shortcut} className="ui-menu__shortcut" />}
            </button>
          </li>
        ))}
      </ul>
    </span>
  );
}

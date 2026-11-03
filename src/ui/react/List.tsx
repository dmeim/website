import { createContext, useContext, type HTMLAttributes, type MouseEvent, type ReactNode, type Ref } from "react";
import { Icon, type IslandIconName as IconName } from "@/ui/icons";
import { cx } from "@/ui/lib/cx";
import { Badge, type BadgeProps } from "./Badge";
import { StatusDot, type StatusDotProps } from "./StatusDot";

type ListTag = "ul" | "ol" | "div";
const ListTagContext = createContext<ListTag>("ul");

export type ListProps = HTMLAttributes<HTMLElement> & {
  as?: ListTag;
  divided?: boolean;
  density?: "compact" | "normal";
  label?: string;
  ref?: Ref<HTMLElement>;
};

export function List({ as: Tag = "ul", divided = true, density = "normal", label, className, children, ...rest }: ListProps) {
  return (
    <ListTagContext.Provider value={Tag}>
      <Tag
        {...(rest as HTMLAttributes<HTMLElement>)}
        className={cx("ui-list", className)}
        role={Tag === "div" ? "list" : undefined}
        aria-label={label}
        data-divided={divided ? "true" : "false"}
        data-density={density}
      >
        {children}
      </Tag>
    </ListTagContext.Provider>
  );
}

export type ListRowProps = Omit<HTMLAttributes<HTMLElement>, "title" | "onSelect"> & {
  title: ReactNode;
  description?: ReactNode;
  label?: ReactNode;
  icon?: IconName;
  media?: ReactNode;
  meta?: ReactNode;
  status?: StatusDotProps;
  badge?: BadgeProps | ReactNode;
  href?: string;
  onSelect?: (event: MouseEvent<HTMLButtonElement>) => void;
  current?: boolean;
  selected?: boolean;
  disabled?: boolean;
  actions?: ReactNode;
  mono?: boolean;
  arrow?: boolean;
  ref?: Ref<HTMLElement>;
};

function isBadgeProps(value: unknown): value is BadgeProps {
  return typeof value === "object" && value !== null && !("$$typeof" in value) && !Array.isArray(value);
}

export function ListRow({
  title,
  description,
  label,
  icon,
  media,
  meta,
  status,
  badge,
  href,
  onSelect,
  current,
  selected,
  disabled,
  actions,
  mono,
  arrow,
  className,
  ...rest
}: ListRowProps) {
  const listTag = useContext(ListTagContext);
  const Item = listTag === "div" ? "div" : "li";
  const external = href?.startsWith("http") ?? false;
  const isLink = Boolean(href) && !disabled;
  const isButton = !href && Boolean(onSelect);
  const showArrow = arrow ?? (Boolean(href) || isButton);

  const inner = (
    <>
      {label != null && <span className="ui-list-row__label">{label}</span>}
      <span className="ui-list-row__main">
        {icon && <Icon name={icon} className="ui-list-row__icon" />}
        {media != null && <span className="ui-list-row__media">{media}</span>}
        <span className="ui-list-row__text">
          <span className="ui-list-row__title">
            {title}
            {external && <span className="ui-visually-hidden"> (opens in new tab)</span>}
          </span>
          {description != null && <span className="ui-list-row__desc">{description}</span>}
        </span>
      </span>
      {(status || badge != null || meta != null || showArrow) && (
        <span className="ui-list-row__trail">
          {status && <StatusDot {...status} />}
          {badge != null && (isBadgeProps(badge) ? <Badge size="sm" {...badge} /> : badge)}
          {meta != null && <span className="ui-list-row__meta">{meta}</span>}
          {showArrow && (
            <span className="ui-list-row__arrow" aria-hidden="true">
              <Icon name={external ? "arrow-up-right" : "arrow-right"} />
            </span>
          )}
        </span>
      )}
    </>
  );

  let body: ReactNode;
  if (href) {
    body = (
      <a
        className="ui-list-row__body"
        href={isLink ? href : undefined}
        aria-current={current ? "page" : undefined}
        aria-disabled={disabled ? true : undefined}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {inner}
      </a>
    );
  } else if (isButton) {
    body = (
      <button
        type="button"
        className="ui-list-row__body"
        disabled={disabled}
        aria-current={current ? "true" : undefined}
        aria-pressed={selected === undefined ? undefined : selected}
        onClick={onSelect}
      >
        {inner}
      </button>
    );
  } else {
    body = (
      <div className="ui-list-row__body" aria-current={current ? "true" : undefined}>
        {inner}
      </div>
    );
  }

  return (
    <Item
      {...(rest as HTMLAttributes<HTMLElement>)}
      className={cx("ui-list-row", className)}
      role={Item === "div" ? "listitem" : undefined}
      data-interactive={isLink || (isButton && !disabled) ? "true" : undefined}
      data-current={current ? "true" : undefined}
      data-selected={selected ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      data-mono={mono ? "true" : undefined}
      data-labelled={label != null ? "true" : undefined}
    >
      {body}
      {actions != null && <div className="ui-list-row__actions">{actions}</div>}
    </Item>
  );
}

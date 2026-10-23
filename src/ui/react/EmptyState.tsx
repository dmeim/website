import { isValidElement, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { Icon, type IconName } from "@/ui/icons";
import { cx } from "@/ui/lib/cx";
import { Button } from "./Button";

export type EmptyStateAction = { label: string; href?: string; onClick?: () => void };

export type EmptyStateProps = {
  icon?: IconName;
  title: string;
  description?: ReactNode;
  action?: ReactNode | EmptyStateAction;
  size?: "sm" | "md" | "lg";
  ref?: Ref<HTMLDivElement>;
} & Omit<HTMLAttributes<HTMLDivElement>, "title">;

function isActionObject(action: unknown): action is EmptyStateAction {
  return typeof action === "object" && action !== null && !isValidElement(action) && "label" in action;
}

export function EmptyState({ icon, title, description, action, size = "md", className, ...rest }: EmptyStateProps) {
  return (
    <div {...rest} className={cx("ui-empty-state", className)} data-size={size}>
      {icon && <Icon name={icon} className="ui-empty-state__icon" />}
      <p className="ui-empty-state__title">{title}</p>
      {description && <div className="ui-empty-state__description">{description}</div>}
      {action != null && (
        <div className="ui-empty-state__action">
          {isActionObject(action) ? (
            <Button href={action.href} onClick={action.onClick} size={size === "sm" ? "sm" : "md"}>
              {action.label}
            </Button>
          ) : (
            (action as ReactNode)
          )}
        </div>
      )}
    </div>
  );
}

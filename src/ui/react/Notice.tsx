import type { AriaRole, HTMLAttributes, ReactNode, Ref } from "react";
import { Icon, type IconName } from "@/ui/icons";
import { cx } from "@/ui/lib/cx";
import { TONE_ICONS, type Tone } from "@/ui/lib/tone-icons";

export type NoticeTone = Tone;

export type NoticeProps = {
  tone?: NoticeTone;
  variant?: "inline" | "callout";
  title?: ReactNode;
  icon?: IconName | false;
  actions?: ReactNode;
  live?: "polite" | "assertive" | "off";
  role?: AriaRole;
  ref?: Ref<HTMLDivElement>;
} & Omit<HTMLAttributes<HTMLDivElement>, "title" | "role">;

export function noticeRole(live: "polite" | "assertive" | "off", role?: string): string | undefined {
  if (role) return role;
  if (live === "off") return undefined;
  return live === "assertive" ? "alert" : "status";
}

export function Notice({
  tone = "neutral",
  variant = "inline",
  title,
  icon,
  actions,
  live,
  role,
  className,
  children,
  ...rest
}: NoticeProps) {
  const liveMode = live ?? (tone === "danger" && variant === "callout" ? "assertive" : "polite");
  const glyph = icon === false ? null : (icon ?? TONE_ICONS[tone]);
  return (
    <div
      role={noticeRole(liveMode, role)}
      aria-live={liveMode === "off" ? undefined : liveMode}
      {...rest}
      className={cx("ui-notice", className)}
      data-tone={tone}
      data-variant={variant}
    >
      {glyph && <Icon name={glyph} weight="fill" className="ui-notice__icon" />}
      <div className="ui-notice__body">
        {title !== undefined && variant === "callout" && <p className="ui-notice__title">{title}</p>}
        {title !== undefined && variant === "inline" && <strong className="ui-notice__title">{title} </strong>}
        {variant === "callout" ? <div className="ui-notice__message">{children}</div> : children}
        {actions && <div className="ui-notice__actions">{actions}</div>}
      </div>
    </div>
  );
}

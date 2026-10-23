import type { ButtonHTMLAttributes, Ref } from "react";
import { Icon } from "@/ui/icons";
import { cx } from "@/ui/lib/cx";
import type { ButtonSize, ButtonVariant } from "./Button";
import { useCopy } from "./use-copy";

type CopySource = { value: string; getValue?: never } | { getValue: () => string; value?: never };

export type CopyButtonProps = CopySource & {
  label?: string;
  copiedLabel?: string;
  appearance?: "button" | "icon" | "inline";
  size?: ButtonSize;
  variant?: ButtonVariant;
  onCopied?: () => void;
  resetAfter?: number;
  ref?: Ref<HTMLButtonElement>;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value" | "children" | "type">;

const APPEARANCE_CLASS = { button: "ui-button", icon: "ui-icon-button", inline: undefined } as const;

export function CopyButton({
  value,
  getValue,
  label = "Copy",
  copiedLabel = "Copied",
  appearance = "button",
  size = "md",
  variant,
  onCopied,
  resetAfter = 1600,
  className,
  onClick,
  ref,
  ...rest
}: CopyButtonProps) {
  const { copied, copy } = useCopy({ resetAfter, onCopied });
  const current = copied ? copiedLabel : label;

  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      className={cx("ui-copy-button", APPEARANCE_CLASS[appearance], className)}
      data-appearance={appearance}
      data-variant={variant ?? (appearance === "icon" ? "ghost" : "secondary")}
      data-size={size}
      data-state={copied ? "copied" : "idle"}
      aria-label={appearance === "icon" ? current : undefined}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) void copy(getValue ? getValue() : (value ?? ""));
      }}
    >
      <span className="ui-copy-button__icon" data-when="idle"><Icon name="copy" /></span>
      <span className="ui-copy-button__icon" data-when="copied"><Icon name="check" /></span>
      {appearance !== "icon" && <span className="ui-copy-button__label">{current}</span>}
      <span className="ui-copy-button__live ui-visually-hidden" aria-live="polite">
        {copied ? copiedLabel : ""}
      </span>
    </button>
  );
}
